import { prisma } from "@/lib/prisma";

const ASSIGNABLE_TRAINEE_ROLES = ["VISITOR", "PENDING_TRAINEE", "TRAINEE"];
const ASSIGNABLE_MENTOR_ROLES = ["MENTOR", "PMP_LEITUNG", "PMP_PRÜFER", "ADMIN"];
const MAX_MENTORS_PER_TRAINING = 3;

export class ExistingTrainingError extends Error {
  constructor(mentorNames: string[]) {
    const assignedMentors = mentorNames.length > 0 ? mentorNames.join(", ") : "keinem Mentor";
    super(`Für diese CID existiert bereits ein Training. Zugeordnete Mentoren: ${assignedMentors}.`);
    this.name = "ExistingTrainingError";
  }
}

export async function applyPendingMentorAssignments(traineeCid: string, traineeId: string) {
  return prisma.$transaction(async (tx) => {
    const [trainee, assignments] = await Promise.all([
      tx.user.findUnique({
        where: { id: traineeId },
        select: { id: true, cid: true, role: true },
      }),
      tx.pendingMentorAssignment.findMany({
        where: { traineeCid },
        include: { mentor: { select: { role: true } } },
      }),
    ]);

    if (!trainee || trainee.cid !== traineeCid) {
      throw new Error("Trainee CID does not match the user account");
    }

    if (!ASSIGNABLE_TRAINEE_ROLES.includes(trainee.role)) {
      throw new Error("This CID does not belong to an eligible trainee account");
    }

    if (assignments.length === 0) {
      return { applied: 0 };
    }

    if (assignments.some(({ mentor }) => !ASSIGNABLE_MENTOR_ROLES.includes(mentor.role))) {
      throw new Error("A reserved mentor no longer has a mentor role");
    }

    const trainings = await tx.training.findMany({
      where: { traineeId },
      include: {
        mentors: {
          include: { mentor: { select: { name: true, cid: true } } },
        },
      },
    });

    if (trainings.length > 0) {
      const mentorNames = Array.from(new Set(trainings.flatMap((training) =>
        training.mentors.map(
          ({ mentor }) => mentor.name || (mentor.cid ? `CID ${mentor.cid}` : "Unbekannt")
        )
      )));
      throw new ExistingTrainingError(mentorNames);
    }

    if (assignments.length > MAX_MENTORS_PER_TRAINING) {
      throw new Error("Es können maximal drei Mentoren vorgemerkt werden");
    }

    if (assignments.length > 0) {
      await tx.training.create({
        data: {
          traineeId,
          mentors: {
            create: assignments.map(({ mentorId }) => ({ mentorId })),
          },
        },
      });
    }

    await tx.pendingMentorAssignment.deleteMany({
      where: { id: { in: assignments.map(({ id }) => id) } },
    });

    if (trainee.role !== "TRAINEE") {
      await tx.user.update({
        where: { id: traineeId },
        data: { role: "TRAINEE", userStatus: null },
      });
    }

    return { applied: assignments.length };
  });
}
