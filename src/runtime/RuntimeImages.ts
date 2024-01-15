import { makeAutoObservable } from 'mobx'
import { MediaImageL } from 'src/models/MediaImage'
import { createMediaImage_fromDataURI, createMediaImage_fromPath } from 'src/models/createMediaImage_fromWebFile'
import { PromptID } from 'src/types/ComfyWsApi'
import { Runtime } from './Runtime'
import { ComfyWorkflowL } from 'src/models/ComfyWorkflow'

/** namespace for all image-related utils */
export class RuntimeImages {
    constructor(private rt: Runtime) {
        makeAutoObservable(this)
    }

    // ----------------------------------------------------------------------------------------
    // simple to use functions
    loadAsImage = async (relPath: string, workflow?: ComfyWorkflowL): Promise<LoadImage> => {
        const img = this.createFromPath(relPath)
        return await img.uploadAndloadAsImage(workflow ?? this.rt.workflow)
    }

    loadAsMask = async (
        relPath: string,
        channel: Enum_LoadImageMask_channel,
        workflow?: ComfyWorkflowL,
    ): Promise<LoadImageMask> => {
        const img = this.createFromPath(relPath)
        return await img.uploadAndloadAsMask(workflow ?? this.rt.workflow, channel)
    }

    loadAsEnum = async (relPath: string): Promise<Enum_LoadImage_image> => {
        const img = this.createFromPath(relPath)
        return await img.uploadAndReturnEnumName()
    }

    // ----------------------------------------------------------------------------------------
    // utils to create CushyStudio `MediaImagesL` without using them directly
    createFromBase64 = (base64Url: string): MediaImageL => {
        return createMediaImage_fromDataURI(this.rt.st, base64Url)
    }

    createFromBase64AsLocalPath = (base64Url: string): MediaImageL => {
        return createMediaImage_fromDataURI(this.rt.st, base64Url)
    }

    createFromPath = (relPath: string, p: { promptID?: PromptID } = {}): MediaImageL => {
        const stepID = this.rt.step.id
        return createMediaImage_fromPath(this.rt.st, relPath, { promptID: p.promptID, stepID })
    }
}
