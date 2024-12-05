import * as PUPPET from '@juzi/wechaty-puppet';
import { FileBoxInterface } from 'file-box';
export type PuppetRabbitOptions = PUPPET.PuppetOptions & {
    mqUri?: string;
    token?: string;
};
declare class PuppetRabbit extends PUPPET.Puppet {
    options: PuppetRabbitOptions;
    private readonly mqManager;
    constructor(options?: PuppetRabbitOptions);
    name(): string;
    version(): string;
    onStart(): Promise<void>;
    onStop(): Promise<void>;
    contactList(): Promise<never[]>;
    roomList(): Promise<never[]>;
    contactRawPayload(id: string): Promise<PUPPET.payloads.Contact>;
    contactRawPayloadParser(payload: PUPPET.payloads.Contact): Promise<PUPPET.payloads.Contact>;
    contactAvatar(contactId: string, fileBox?: FileBoxInterface): Promise<any>;
    dirtyPayload(type: PUPPET.types.Dirty, id: string): Promise<void>;
    postSearch(filter: PUPPET.filters.Post, pagination: PUPPET.filters.PaginationRequest): Promise<PUPPET.filters.PaginationResponse<string[]>>;
    postRawPayload(id: string): Promise<PUPPET.payloads.Post>;
    postRawPayloadParser(payload: PUPPET.payloads.Post): Promise<PUPPET.payloads.Post>;
    postPayloadSayable(postId: string, sayableId: string): Promise<PUPPET.payloads.Sayable>;
    postPublish(payload: PUPPET.payloads.PostClient): Promise<string>;
    initEvents(): void;
    removeEvents(): void;
}
export { PuppetRabbit };
export default PuppetRabbit;
//# sourceMappingURL=puppet.d.ts.map