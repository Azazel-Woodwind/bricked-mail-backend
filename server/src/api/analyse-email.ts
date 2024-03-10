import ClaudeService from "../service/claude.service";
import { stringifyEmail } from "../utils";

export async function analyseEmail(email: Email): Promise<IEmail> {
    const emailString = stringifyEmail(email);
    const [importance, category, deadline] = await Promise.all([
        ClaudeService.evaluateImportance(emailString),

        ClaudeService.evaluateCategory(emailString),

        ClaudeService.evaluateDeadline(emailString),
    ]);

    let briefSummary, longSummary;
    if (importance > 5) {
        briefSummary = await ClaudeService.generateBriefSummary(emailString);
    }

    if (importance > 7) {
        longSummary = await ClaudeService.generateLongSummary({
            email: emailString,
        });
    }

    return {
        brief_summary: briefSummary,
        long_summary: longSummary,
        importance: importance,
        category,
        deadline,
    };
}
