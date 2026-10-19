export function FieldError({ message }: { message?: string }) {
	if (!message) return null;

	return <div className="text-red-500 text-sm">{message}</div>;
}
