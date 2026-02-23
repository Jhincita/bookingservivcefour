import ical from "ical-generator";

export function generateICS({
                                title,
                                description,
                                start,
                                end,
                            }: {
    title: string;
    description?: string;
    start: Date;
    end: Date;
}) {
    const cal = ical({ name: "Appointment" });

    cal.createEvent({
        start,
        end,
        summary: title,
        description,
    });

    return cal.toString();
}
