type AssignmentNotification = {
  traineeCid: string;
  hasAccount: boolean;
  traineeName: string | null;
  mentorName: string;
};

const CONTACT_DETAILS =
  "Bei technischen Problemen wende dich gerne an @Jacob Koglin, bei Problemen während des Trainings an die PMP-Leitung (Boris Pilecki oder Timo Heller). Genug geredet – viel Spaß bei deinem Training!";

export async function sendMentorAssignmentNotification({
  traineeCid,
  hasAccount,
  traineeName,
  mentorName,
}: AssignmentNotification) {
  const token = process.env.VATGER_NOTIFICATION_TOKEN;
  if (!token) {
    throw new Error("VATGER_NOTIFICATION_TOKEN ist nicht konfiguriert");
  }

  const baseUrl = (
    process.env.PMP_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://pmp.vatsim-germany.org"
  ).replace(/\/$/, "");
  const dashboardUrl = `${baseUrl}/trainee/progress`;
  const websiteUrl = `${baseUrl}/`;
  const greeting = traineeName?.trim() ? `Hai ${traineeName.trim()}` : "Hai";
  const message = hasAccount
    ? `${greeting}, herzlich willkommen beim VATGER Piloten-Mentoren-Programm! Wir haben einen Mentor für dich gefunden: @${mentorName} wird sich in Kürze hier über das Forum bei dir melden. Da du bereits auf der PMP-Website registriert bist, musst du nichts weiter tun. Unter ${dashboardUrl} kannst du ab sofort deinen Trainingsfortschritt verfolgen. Wir wünschen frohes Lernen! ${CONTACT_DETAILS}`
    : `Herzlich willkommen beim vatger Piloten-Mentoren-Programm! Wir haben einen Mentor für dich gefunden: @${mentorName} wird sich zeitnah hier im Forum bei dir melden. Damit du deinen Trainingsfortschritt verfolgen kannst, melde dich bitte einmalig auf der PMP-Website mit deinem VATSIM-Germany-Konto an: Öffne ${websiteUrl}, klicke oben auf „PMP Intern“ und anschließend auf „Mit VATGER anmelden“. Danach kannst du unter „Trainee“ deinen Trainingsfortschritt verfolgen. ${CONTACT_DETAILS}`;

  const response = await fetch(
    `http://hp.vatsim-germany.org/api/user/${encodeURIComponent(traineeCid)}/send_notification`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Willkommen beim PMP",
        message,
        source_name: "PMP",
        link_text: hasAccount ? "Trainingsfortschritt" : "PMP Website",
        link_url: hasAccount ? dashboardUrl : websiteUrl,
        via: "",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Notification API antwortete mit HTTP ${response.status}`);
  }
}
