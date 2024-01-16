import { mkdir, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { imageMeta } from 'image-meta'
import { hashArrayBuffer } from 'src/state/hashBlob'
import { STATE } from 'src/state/state'
import { nanoid } from 'nanoid'
import { MediaImageL } from './MediaImage'
import { extractExtensionFromContentType } from 'src/widgets/misc/extractExtensionFromContentType'
import { PromptID } from 'src/types/ComfyWsApi'
import { dirname } from 'pathe'
import { toastInfo } from 'src/utils/misc/toasts'

type imageCreationOpts = {
    promptID?: PromptID
    stepID?: StepID
}

export const createMediaImage_fromFileObject = async (st: STATE, file: File, subFolder?: string): Promise<MediaImageL> => {
    console.log(`[🌠] createMediaImage_fromFileObject`)
    const relPath = `outputs/${subFolder ?? 'imported'}/${file.name}` as RelativePath
    return createMediaImage_fromBlobObject(st, file, relPath)
}

export const createMediaImage_fromBlobObject = async (st: STATE, blob: Blob, relPath: string): Promise<MediaImageL> => {
    console.log(`[🌠] createMediaImage_fromBlobObject`)
    const dir = dirname(relPath)
    mkdirSync(dir, { recursive: true })
    const buff: Buffer = await blob.arrayBuffer().then((x) => Buffer.from(x))
    writeFileSync(relPath, buff)
    return _createMediaImage_fromLocalyAvailableImage(st, relPath, buff)
}

export const createMediaImage_fromDataURI = (st: STATE, dataURI: string, subFolder?: string): MediaImageL => {
    mkdirSync(`outputs/${subFolder}/`, { recursive: true })
    // type: 'data:image/png;base64,' => 'png
    const contentType = dataURI.split(';')[0].split(':')[1]
    if (contentType == null) throw new Error(`❌ dataURI mediaType is null`)
    if (contentType.length === 0) throw new Error(`❌ dataURI mediaType is empty`)
    if (contentType === 'text/plain') throw new Error(`❌ dataURI mediaType is text/plain`)
    if (contentType === 'text/html') throw new Error(`❌ dataURI mediaType is text/html`)
    const ext = extractExtensionFromContentType(contentType)
    if (ext == null) throw new Error(`❌ impossible to extract extension from dataURI`)

    const payload = dataURI.split(',')[1]
    if (payload == null) throw new Error(`❌ dataURI base64 payload is null`)
    if (payload.length === 0) throw new Error(`❌ dataURI base64 payload is empty`)
    const buff = Buffer.from(payload, 'base64')

    // 🔴🔴🔴🔴🔴
    const hash = hashArrayBuffer(new Uint8Array(buff))
    // 🔴🔴🔴🔴🔴

    // const fName = nanoid() + ext
    const fName = hash + ext
    const relPath = `outputs/${subFolder}/${fName}` as RelativePath
    writeFileSync(relPath, buff)
    return _createMediaImage_fromLocalyAvailableImage(st, relPath, buff)
}

export const createMediaImage_fromPath = (
    //
    st: STATE,
    relPath: string,
    opts?: imageCreationOpts,
): MediaImageL => {
    const buff = readFileSync(relPath)
    return _createMediaImage_fromLocalyAvailableImage(st, relPath, buff, opts)
}

const _createMediaImage_fromLocalyAvailableImage = (
    st: STATE,
    relPath: string,
    preBuff?: Buffer,
    opts?: imageCreationOpts,
): MediaImageL => {
    const buff: Buffer = preBuff ?? readFileSync(relPath)
    const uint8arr = new Uint8Array(buff)
    const fileSize = uint8arr.byteLength
    const meta = imageMeta(uint8arr)
    if (meta.width == null) throw new Error(`❌ size.width is null`)
    if (meta.height == null) throw new Error(`❌ size.height is null`)
    const hash = hashArrayBuffer(uint8arr)
    console.log(`[🏞️]`, { ...meta, hash })

    const prevs = st.db.media_images.find({ path: relPath }, { limit: 1 })
    const prev = prevs[0]

    if (prev) {
        console.log(`[🏞️] updating existing imamge`)
        toastInfo(`🏞️ updating existing imamge`)
        prev.update({
            orientation: meta.orientation,
            type: meta.type,
            fileSize: fileSize,
            width: meta.width,
            height: meta.height,
            hash,
            path: relPath,
            promptID: opts?.promptID ?? prev.data.promptID,
            stepID: opts?.stepID ?? prev.data.stepID,
        })
        return prev
    }

    console.log(`[🏞️] create new imamge`)
    return st.db.media_images.create({
        orientation: meta.orientation,
        type: meta.type,
        fileSize: fileSize,
        width: meta.width,
        height: meta.height,
        hash,
        path: relPath,
        promptID: opts?.promptID,
        stepID: opts?.stepID,
    })
}