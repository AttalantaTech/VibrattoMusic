export const splitOnUppercase = (text: string): string => {
    return text.split(/(?=[A-Z])/).join(" ");
}