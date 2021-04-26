declare module 'gauge' {
    export default class Gauge {
        setTemplate(template: string): void;

        isEnabled(): boolean;

        setThemeset(themes: string[]): void;

        setTheme(theme: string): void;

        getWidth(): number;

        setWriteTo(writeTo: WritableStream, tty: WritableStream | undefined)

        enable(): void;

        disable(): void;

        hide(): void;

        show(section: string | object, completed: number): void;

        pulse(subsection: string | undefined): void;
    }
}
