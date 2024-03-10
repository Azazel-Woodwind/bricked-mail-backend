interface Email {
    id: string;
    subject: string | undefined;
    from: string | undefined;
    to: string | undefined;
    date: string | undefined;
    snippet: string;
    categories: string;
    attachments: Array<{ filename: string; size: number }>;
    body: string;
    cc: string;
}

interface IEmail {
    brief_summary?: string;
    long_summary?: string;
    importance?: number;
    category?: string;
    deadline?: string;
}

interface UserInformation {
    email: string;
}

interface UserSocket extends Socket {
    token?: TokenObject;
    settings?: Settings;
    auth?: Auth;
    user?: User;
}

interface Settings {}
interface Credentials {
    installed?: ClientSecret;
    web?: ClientSecret;
}

interface ClientSecret {
    client_id: string;
    client_secret: string;
}

interface TokenObject {
    type: string;
    client_id: string;
    client_secret: string;
    refresh_token: string;
}
