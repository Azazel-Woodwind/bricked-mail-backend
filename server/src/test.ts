import { EventEmitter } from "stream";
import ClaudeService from "./service/claude.service";
import Anthropic from "@anthropic-ai/sdk";

const email = `
From: Michelle Dixon <michelle.dixon@caplin.com>

Date: Wed, 6 Mar 2024 13:13:45 -0000

Subject: Formal Offer of Employment - Caplin Systems Ltd

To: Kai Strachan <kaistrachan11@gmail.com>

Cc: Mike Salsbury <mike.salsbury@caplin.com>, Lorna Guy <lorna.guy@caplin.com>

Hi Kai,

We are very happy to have you join us as a Graduate with a proposed start

date of 5th August 2024 (as discussed, based on your circumstances, we can

be flexible if this needs to be amended).

Attached is a copy of your offer letter and contract, which I will also

send to you in a moment for you to sign via Docusign.

On your first day you will start at *10.00am *. First I=E2=80=99ll meet wit=

h you to

have a HR & Health & Safety induction =E2=80=93 for this meeting please hav=

e to

hand your passport, and a utility bill (excluding a mobile phone bill) or

bank statement, which shows your home address, dated in the last 3 months.

For your first day please come to our office (5th Floor Eastcheap Court, 11

Philpot Lane, EC3M 8AA).

I have also attached a copy of our employee privacy statement so that you

are aware of how we process our employees=E2=80=99 data. Further informatio=

n in

regards to GDPR will be sent on your first day.

Additionally, please provide contact details (email addresses specifically)

of two referees, by return email =E2=80=93 one of which should be your most=

 recent

employer.

Finally, you are required to complete a background check to formalise your

employment at Caplin.  Within the next week you will receive an email via

Hireright;  please follow all instructions in order to complete the online

check. When completing the application form please ensure all company names

are written in full (e.g. =E2=80=98Caplin Systems Ltd=E2=80=99) and that yo=

u do not leave

any unaccounted for gaps in your employment history. You will then be

issued with a unique reference number for your specific application. *Pleas=

e

complete this check within 5 days of receiving the email.*

I look forward to working with you.

Kind regards,

Michelle

--=20

*Michelle Dixon*

HR & Office Manager

Caplin Systems Ltd

Mobile: +44 (0)7805530431

DDI: +44 (0)20 7826 9847

www.caplin.com

Follow @CaplinSystems on Twitter: *http://twitter.com/CaplinSystems*

<http://twitter.com/CaplinSystems>
`;

// const importance = await ClaudeService.generateLongSummary({ email });
// console.log("LONG SUMMARY ONLY:", importance);

// console.log("STARTING");
// const ok = await ClaudeService.generateLongSummary({ email });
// console.log("FINAL SUMMARY:", ok);
// const promises = [];
// for (let i = 0; i < 3; i++) {
//     ClaudeService.evaluateImportance(email);
//     // promises.push(
//     //     Promise.all([
//     //         ClaudeService.evaluateImportance(email),
//     //         ClaudeService.evaluateCategory(email),
//     //         ClaudeService.evaluateDeadline(email),
//     //     ])
//     // );
// }

// await new Promise(resolve => setTimeout(resolve, 1000));

// const eventEmitter = new EventEmitter();
// eventEmitter.on("token", token => {
//     process.stdout.write(token);
// });
// const ok = await ClaudeService.generateLongSummary({ email, eventEmitter });
// console.log("FINAL SUMMARY:", ok);

const client = new Anthropic({
    apiKey: process.env["ANTHROPIC_KEY"],
});

const content = `
How can I use React Native and Expo to create and send persistent notifications from my backend typescript server? For example, on the backend I maintain a count of emails. I want there to be a notification that reflects this count. When the count changes on the backend, I want the same notification to be updated. Alternatively, the notification can be removed and replaced with a new one. I want this to be possible even if the app is not foregrounded.
`;

const res = await client.messages.create({
    model: "claude-3-opus-20240229",
    max_tokens: 1500,
    temperature: 0.5,
    system: "You are an expert coder that gives advice.",
    messages: [
        {
            role: "user",
            content: content,
        },
    ],
});

console.log(res.content[0].text);

// const data = await Promise.all(promises);
// console.log(data);
