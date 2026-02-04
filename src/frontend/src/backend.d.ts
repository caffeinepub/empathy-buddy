import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface Expression {
    id: string;
    status: ExpressionStatus;
    creator: AnonymousUser;
    createdAt: Time;
    audioBlobId: ExternalBlob;
    updatedAt: Time;
    moderationStatus: ModerationStatus;
    empathyType: EmpathyType;
}
export interface Response {
    id: string;
    responder: AnonymousUser;
    createdAt: Time;
    expressionId: string;
    audioBlobId: ExternalBlob;
    updatedAt: Time;
}
export type AnonymousUser = Principal;
export enum EmpathyType {
    silentPresence = "silentPresence",
    mirroring = "mirroring",
    reflection = "reflection",
    listening = "listening"
}
export enum ExpressionStatus {
    assigned = "assigned",
    pending = "pending",
    completed = "completed",
    rejected = "rejected"
}
export enum ModerationStatus {
    unchecked = "unchecked",
    safe = "safe",
    unsafe = "unsafe"
}
export interface backendInterface {
    assignRandomExpression(arg0: Principal): Promise<Expression | null>;
    getAvailableExpressions(): Promise<Array<Expression>>;
    getExpression(id: string): Promise<Expression | null>;
    getResponse(id: string): Promise<Response | null>;
    moderateExpression(id: string, isSafe: boolean): Promise<void>;
    respondToExpression(expressionId: string, audioBlob: ExternalBlob): Promise<string>;
    reviewAndAssign(id: string, isSafe: boolean): Promise<void>;
    uploadExpression(audioBlob: ExternalBlob, empathyType: EmpathyType): Promise<string>;
}
