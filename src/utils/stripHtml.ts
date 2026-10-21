export function stripHtml(html?: string | null): string {
	if (!html) return "";

	// Se o texto veio escapado (ex.: de um JSON), restaura as aspas e remove \n e \t literais
	const normalized = html.replace(/\\[ntr]/g, " ").replace(/\\"/g, '"');

	const document_ = new DOMParser().parseFromString(normalized, "text/html");

	// Quebras de linha para <br> e blocos
	document_.querySelectorAll("br").forEach((br) => {
		br.replaceWith("\n");
	});
	document_.querySelectorAll("p, div, li").forEach((element) => {
		element.append("\n");
	});

	// Espaço entre spans vizinhos (ex.: emoji + rótulo)
	document_.querySelectorAll("span").forEach((element) => {
		element.append(" ");
	});

	return (document_.body.textContent ?? "")
		.split("\n")
		.map((line) => line.replace(/\s+/g, " ").trim())
		.filter(Boolean)
		.join("\n");
}
