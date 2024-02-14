import type { EnumValue } from 'src/models/Schema'
import type { ModelInfo } from 'src/manager/model-list/model-list-loader-types'
import type { KnownModel_Name } from 'src/manager/model-list/KnownModel_Name'
import type { Widget_enum_config } from './widgets/enum/WidgetEnum'

export const extractDefaultValue = (input: Widget_enum_config<any>): Maybe<EnumValue> => {
    const def = input.default

    if (def != null) {
        // case value (backwards compat)
        if (typeof def === 'string') return def
        if (typeof def === 'boolean') return def
        if (typeof def === 'number') return def

        // case defaultModel
        // ⏸️ const def2 = def as EnumDefault<T>
        // ⏸️ if (def2.value != null) return def2.value as any

        // ⏸️ const entry = Array.isArray(def2) ? def2[0] : def2
        // ⏸️ const knownModels = getKnownModels()
        // ⏸️ const modelInfo = knownModels.get(entry)
        // ⏸️ if (modelInfo == null) {
        // ⏸️     console.error(`Unknown model: ${entry}`)
        // ⏸️     return null
        // ⏸️ }
        // ⏸️ return modelInfo.filename
    }

    // default
    return null
}

export type RecommendedModelDownload = {
    modelFolderPrefix?: string
    // prettier-ignore
    knownModel?:
        | KnownModel_Name
        | KnownModel_Name[]
    customModels?: ModelInfo | ModelInfo[]
}

/**
 * this object is the new value that
 * needs to be given to an enum default.
 */
// ⏸️ export type EnumDefault<T extends KnownEnumNames = any> = {
// ⏸️     /** 🔶 */
// ⏸️     value?: Requirable[T] | string
// ⏸️     /** 🔴 UNIMPLEMENTED */
// ⏸️     values?: string[]
// ⏸️     /** 🔶 */
// ⏸️     /** 🔴 UNIMPLEMENTED */
// ⏸️     find?: (candidate: string) => number
// ⏸️     /** 🔴 UNIMPLEMENTED */
// ⏸️     // customDownloads?: { [modelName: string]: ModelInfo }
// ⏸️ }

/** showcase an example default value with all options filled */
// const example: EnumDefault<Enum_IPAdapterModelLoader_ipadapter_file> = {
//     value: 'ip-adapter_sd15.safetensors',
//     values: [
//         //
//         'ip-adapter_sd15.safetensors',
//         'ip-adapter_sd15',
//     ],
//     find: (candidate: string) => {
//         if (candidate === 'ip-adapter_sd15.safetensors') return 10
//         if (candidate.includes('ip-adapter')) return 5
//         return 0
//     },
//     knownModel: ['ip-adapter_sd15.safetensors'],
// }
