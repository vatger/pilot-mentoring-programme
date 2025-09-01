import AnimatedError from '@/components/AnimatedError';

export default function NotFound() {
  return (
    <AnimatedError
      title="Seite nicht gefunden (404)"
      message="Die gesuchte Seite existiert nicht oder wurde verschoben. Du kannst zur Startseite zurückkehren."
      showHome={true}
    />
  );
}
