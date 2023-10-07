import type { ComfyEnumDef, ComfyInputOpts, ComfyInputType, ComfySchemaJSON } from '../types/ComfySchemaJSON'

import { LiveInstance } from 'src/db/LiveInstance'
import { CodeBuffer } from '../utils/CodeBuffer'
import { ComfyPrimitiveMapping, ComfyPrimitives } from '../core/Primitives'
import { normalizeJSIdentifier } from '../core/normalizeJSIdentifier'
import { toJS } from 'mobx'
import { escapeJSKey } from './escapeJSKey'

export type EnumHash = string
export type EnumName = string

export type NodeNameInComfy = string
export type NodeNameInCushy = string
export type EmbeddingName = Branded<string, 'Embedding'>

export type NodeInputExt = {
    nameInComfy: string
    nameInComfyEscaped: string
    type: string
    opts?: ComfyInputOpts
    isPrimitive: boolean
    required: boolean
    index: number
}
export type NodeOutputExt = {
    typeName: string
    nameInCushy: string
    isPrimitive: boolean
}

export type EnumValue = string | boolean | number

export type SchemaT = {
    id: 'main-schema'
    createdAt: number
    updatedAt: number
    spec: ComfySchemaJSON
    embeddings: EmbeddingName[]
}

export interface SchemaL extends LiveInstance<SchemaT, SchemaL> {}
export class SchemaL {
    getLoraHierarchy = (): string[] => {
        const loras = this.getLoras()
        return []
    }

    getLoras = (): Enum_LoraLoader_lora_name[] => {
        const candidates = this.knownEnumsByName.get('Enum_LoraLoader_lora_name') ?? []
        return candidates as Enum_LoraLoader_lora_name[]
    }

    getEnumOptionsForSelectPicker = (enumName: string) => {
        const candidates = this.knownEnumsByName.get(enumName) ?? []
        return candidates.map((x) => ({ label: x, value: x }))
    }

    knownTypes = new Set<string>()
    knownEnumsByName = new Map<EnumName, EnumValue[]>()
    knownEnumsByHash = new Map<
        EnumHash,
        {
            // enumNameInComfy: string
            enumNameInCushy: EnumName
            values: EnumValue[]
            aliases: string[]
        }
    >()
    nodes: ComfyNodeSchema[] = []
    nodesByNameInComfy: { [key: string]: ComfyNodeSchema } = {}
    nodesByNameInCushy: { [key: string]: ComfyNodeSchema } = {}
    nodesByProduction: { [key: string]: NodeNameInCushy[] } = {}

    // components: ItemDataType[] = []

    // constructor(
    //     //
    //     public db: LiveDB,
    //     public spec: ComfySchemaJSON,
    //     public embeddings: EmbeddingName[],
    // ) {
    //     this.onUpdate(spec, embeddings)
    //     makeAutoObservable(this)
    // }

    /** on update is called automatically by live instances */
    onUpdate() {
        this.log('updating schema')
        // reset spec
        // this.spec = this.data.spec
        // this.embeddings = this.data.embeddings
        this.knownTypes.clear()
        this.knownEnumsByHash.clear()
        this.knownEnumsByName.clear()
        this.nodes.splice(0, this.nodes.length)
        this.nodesByNameInComfy = {}
        this.nodesByNameInCushy = {}
        this.nodesByProduction = {}

        // compile spec
        const entries = Object.entries(this.data.spec)
        for (const [nodeNameInComfy, nodeDef] of entries) {
            // console.chanel?.append(`[${nodeNameInComfy}]`)
            // apply prefix
            const normalizedNodeNameInCushy = normalizeJSIdentifier(nodeNameInComfy)
            // prettier-ignore
            const nodeNameInCushy =
                // nodeDef.category.startsWith('WAS Suite/') ? `WAS${normalizedNodeNameInCushy}` :
                // nodeDef.category.startsWith('ImpactPack') ? `Impact${normalizedNodeNameInCushy}` :
                // nodeDef.category.startsWith('Masquerade Nodes') ? `Masquerade${normalizedNodeNameInCushy}` :
                normalizedNodeNameInCushy
            // console.log('>>', nodeTypeDef.category, nodeNameInCushy)

            const inputs: NodeInputExt[] = []
            const outputs: NodeOutputExt[] = []
            const node = new ComfyNodeSchema(
                //
                nodeNameInComfy,
                nodeNameInCushy,
                // nodeTypeName,
                nodeDef.category,
                inputs,
                outputs,
            )

            // INDEX NODE
            this.nodesByNameInComfy[nodeNameInComfy] = node
            this.nodesByNameInCushy[nodeNameInCushy] = node
            this.nodes.push(node)

            // OUTPUTS ----------------------------------------------------------------------
            const outputNamer: { [key: string]: number } = {}
            // console.info(JSON.stringify(nodeDef.output))
            for (const [ix, slotType] of nodeDef.output.entries()) {
                const rawOutputSlotName =
                    nodeDef.output_name[ix] || //
                    (typeof slotType === 'string' ? slotType : `input_${ix}`)

                const outputNameInComfy = normalizeJSIdentifier(rawOutputSlotName)
                const at = (outputNamer[outputNameInComfy] ??= 0)
                const outputNameInCushy = at === 0 ? outputNameInComfy : `${outputNameInComfy}_${at}`
                outputNamer[outputNameInComfy]++
                // console.log('>>', outputNameInComfy, outputNameInCushy)

                let slotTypeName: string
                if (typeof slotType === 'string') {
                    slotTypeName = normalizeJSIdentifier(slotType)
                    this.knownTypes.add(slotTypeName)
                } else if (Array.isArray(slotType)) {
                    const uniqueEnumName = `Enum_${nodeNameInCushy}_${outputNameInCushy}_out`
                    slotTypeName = this.processEnumNameOrValue({ candidateName: uniqueEnumName, comfyEnumDef: slotType })
                } else {
                    throw new Error(`invalid output ${ix} "${slotType}" in node "${nodeNameInComfy}"`)
                }
                // const optNormalized = normalizeJSIdentifier(slotType)
                // this.knownTypes.add(optNormalized)

                // index production
                let arr = this.nodesByProduction[slotTypeName]
                if (arr == null) this.nodesByProduction[slotTypeName] = [nodeNameInCushy]
                else arr.push(nodeNameInCushy)

                // const at = (outputNamer[slotType] ??= 0)
                // const nameInComfy = at === 0 ? slotType : `${slotType}_${at}`
                // const nameInCushy = normalizeJSIdentifier(nameInComfy)
                outputs.push({
                    typeName: slotTypeName,
                    // nameInCushy: outputNameInComfy,
                    nameInCushy: outputNameInCushy,
                    isPrimitive: false,
                })
                // outputNamer[slotType]++
            }

            // INPUTS ----------------------------------------------------------------------
            const requiredInputs = Object.entries(nodeDef.input?.required ?? {}) //
                .map(([name, spec]) => ({ required: true, name, spec }))
            const optionalInputs = Object.entries(nodeDef.input?.optional ?? {}) //
                .map(([name, spec]) => ({ required: false, name, spec }))
            const allInputs = [
                //
                ...requiredInputs,
                ...optionalInputs,
            ]

            for (const ipt of allInputs) {
                const inputNameInComfy = ipt.name
                const inputNameInCushy = normalizeJSIdentifier(ipt.name)
                const typeDef = ipt.spec
                const slotType = typeDef[0]
                const slotOpts = typeDef[1]

                /** name of the type in cushy */
                let inputTypeNameInCushy: string | undefined

                if (typeof slotType === 'string') {
                    inputTypeNameInCushy = normalizeJSIdentifier(slotType)
                    this.knownTypes.add(inputTypeNameInCushy)
                } else if (Array.isArray(slotType)) {
                    const uniqueEnumName = `Enum_${nodeNameInCushy}_${inputNameInCushy}`
                    inputTypeNameInCushy = this.processEnumNameOrValue({ candidateName: uniqueEnumName, comfyEnumDef: slotType })
                } else {
                    throw new Error(`invalid input "${ipt.name}" in node "${nodeNameInComfy}"`)
                }

                if (inputTypeNameInCushy) {
                    node.inputs.push({
                        required: ipt.required,
                        nameInComfy: inputNameInComfy,
                        nameInComfyEscaped: escapeJSKey(inputNameInComfy),
                        type: inputTypeNameInCushy,
                        opts: slotOpts,
                        isPrimitive: ComfyPrimitives.includes(inputTypeNameInCushy),
                        index: node.inputs.length, // 🔴
                    })
                } else {
                    console.log(toJS({ ipt, typeDef, typeStuff: slotType }))
                    console.log(toJS({ typeStuff: slotType }))
                    throw new Error(`object type not supported`)
                }
            }
        }

        // this.updateComponents()
    }

    processEnumNameOrValue = (p: {
        //
        candidateName: string
        comfyEnumDef: ComfyEnumDef
    }): string => {
        const enumValues: EnumValue[] = []
        let finalEnumName: string
        for (const enumValue of p.comfyEnumDef) {
            if (typeof enumValue === 'string') enumValues.push(enumValue)
            else if (typeof enumValue === 'boolean') enumValues.push(enumValue)
            else if (typeof enumValue === 'number') enumValues.push(enumValue)
            else enumValues.push(enumValue.content)
        }
        const hash = enumValues.sort().join('|')
        const similarEnum = this.knownEnumsByHash.get(hash)
        const uniqueEnumName = p.candidateName // `Enum_${nodeNameInCushy}_${inputNameInCushy}`
        this.knownEnumsByName.set(uniqueEnumName, enumValues)
        if (similarEnum != null) {
            finalEnumName = similarEnum.enumNameInCushy
            similarEnum.aliases.push(uniqueEnumName)
        } else {
            finalEnumName = uniqueEnumName
            this.knownEnumsByHash.set(hash, {
                enumNameInCushy: finalEnumName, // normalizeJSIdentifier(finalEnumName),
                // enumNameInComfy: inputNameInComfy,
                values: enumValues,
                aliases: [],
            })
        }
        return finalEnumName
    }

    // updateComponents() {
    //     this.components = []
    //     this.knownEnums.forEach((enumDef) => {
    //         this.components.push({
    //             name: enumDef.enumNameInCushy,
    //             type: 'enum',
    //             // values: enumDef.values,
    //             children: enumDef.values.map((v) => ({ name: v, type: 'enum-value' })),
    //         })
    //     })
    // }
    get requirables(): {
        name: string
        kind: 'enum' | 'node' | 'prim'
    }[] {
        const out: { name: string; kind: 'enum' | 'node' | 'prim' }[] = []
        for (const n of this.knownTypes) out.push({ name: n, kind: 'prim' })
        for (const n of this.knownEnumsByName) out.push({ name: n[0], kind: 'enum' })
        for (const n of this.nodes) out.push({ name: n.nameInCushy, kind: 'node' })
        return out
    }

    codegenDTS = (): string => {
        const prefix = '../src/'
        const b = new CodeBuffer()
        const p = b.w

        // 1️⃣ if (opts.cushySrcPathPrefix == null) {
        // 1️⃣     p(`/// <reference path="cushy.d.ts" />`)
        // 1️⃣ }
        p('')
        p(`import type { ComfyNode } from '${prefix}core/Node'`)
        p(`import type { Slot } from '${prefix}core/Slot'`)
        p(`import type { ComfyNodeSchemaJSON } from '${prefix}types/ComfySchemaJSON'`)
        p(`import type { ComfyNodeUID } from '${prefix}types/NodeUID'`)
        p(`import type { ActionType } from '${prefix}core/Requirement'`)
        // p(`import type { WorkflowType } from '${prefix}core/WorkflowFn'`)
        p('')
        p(`// CONTENT IN THIS FILE:`)
        p('//')
        p('//  0. Entrypoint')
        p('//  1. Requirable')
        p('//  2. Embeddings')
        p('//  3. Suggestions')
        p('//  4. TYPES')
        p('//  5. ACCEPTABLE')
        p('//  6. ENUMS')
        p('//  7. INTERFACES')
        p('//  8. NODES')
        p('//  9. INDEX')
        p('')
        p(`declare global {`)
        p(`const action: ActionType`)
        p(``)
        p(`\n// 0. Entrypoint --------------------------`)
        p(`export interface ComfySetup {`)
        // prettier-ignore
        for (const n of this.nodes) {
            p(`    /* category:${n.category}, name:"${n.nameInComfy}", output:${n.outputs.map(o => o.nameInCushy).join('+')} */`)
            p(`    ${n.nameInCushy}(p: ${n.nameInCushy}_input, id?: ComfyNodeUID): ${n.nameInCushy}`)
        }
        p(`}`)

        p(`\n// 1. Requirable --------------------------`)
        p(`export interface Requirable {`)
        const requirables = this.requirables
        for (const n of requirables) p(`    ${escapeJSKey(n.name)}: ${n.name},`)
        p(`}`)

        p(`\n// 2. Embeddings -------------------------------`)
        p(
            `export type Embeddings = ${
                this.data.embeddings.length == 0 //
                    ? '""' // fixes the problem when someone has no embedding
                    : this.data.embeddings.map((e) => wrapQuote(e)).join(' | ')
            }`,
        )

        p(`\n// 3. Suggestions -------------------------------`)
        for (const [k, value] of Object.entries(ComfyPrimitiveMapping)) {
            p(`export interface CanProduce_${value} {}`)
        }
        for (const [tp, nns] of Object.entries(this.nodesByProduction)) {
            p(`export interface CanProduce_${tp} extends Pick<ComfySetup, ${nns.map((i) => `'${i}'`).join(' | ')}> { }`)
        }

        p(`\n// 4. TYPES -------------------------------`)
        const types = [...this.knownTypes.values()] //
            .map((comfyType) => ({
                comfyType,
                normalizedType: normalizeJSIdentifier(comfyType),
                tsType: this.toTSType(comfyType),
            }))
            .sort((a, b) => b.tsType.length - a.tsType.length)

        for (const t of types) {
            // const tsType = this.toTSType(t)
            p(`export type ${t.normalizedType} = ${t.tsType}`)
        }

        p(`\n// 5. ACCEPTABLE INPUTS -------------------------------`)
        for (const t of types) {
            // const tsType = this.toTSType(t)
            p(
                `export type _${t.normalizedType} = ${t.tsType} | HasSingle_${t.normalizedType} | ((x: CanProduce_${t.normalizedType}) => _${t.normalizedType})`,
            )
            // ${i.type} | HasSingle_${i.type}
        }

        p(`\n// 6. ENUMS -------------------------------`)
        for (const e of this.knownEnumsByHash.values()) {
            if (e.values.length > 0) {
                p(`export type ${e.enumNameInCushy} = ${e.values.map((v) => `${JSON.stringify(v)}`).join(' | ')}`)
                if (e.aliases.length > 0) {
                    for (const alias of e.aliases) {
                        p(`export type ${alias} = ${e.enumNameInCushy}`)
                    }
                }
            } else {
                p(`export type ${e.enumNameInCushy} = '🔴' // never`)
            }
        }

        p(`\n// 7. INTERFACES --------------------------`)
        for (const t of this.knownTypes.values()) {
            p(`export interface HasSingle_${t} { _${t}: ${t} } // prettier-ignore`)
        }
        // for (const t of this.knownEnums.values()) {
        //     p(
        //         `export interface HasSingle_${t.enumNameInCushy} { _${t.enumNameInCushy}: ${t.enumNameInCushy} } // prettier-ignore`,
        //     )
        // }

        p(`\n// 8. NODES -------------------------------`)
        for (const n of this.nodes) p(n.codegen())

        p(`\n// 9. INDEX -------------------------------`)
        // p(`export const nodes = {`)
        // for (const n of this.nodes) p(`    ${n.name},`)
        // p(`}`)
        // p(`export type NodeType = keyof typeof nodes`)

        p(`export type Schemas = {`)
        for (const n of this.nodes) p(`    ${n.nameInCushy}: ComfyNodeSchemaJSON,`)
        p(`}`)
        p(`export type ComfyNodeType = keyof Schemas`)

        p(`}`) // 🔴

        // p(`\n// Entrypoint --------------------------`)
        // p(`export interface ComfySetup {`)

        // // prettier-ignore
        // for (const n of this.nodes) {
        //     p(`    ${n.nameInCushy}(args: ${n.nameInCushy}_input, uid?: ComfyNodeUID): ${n.nameInCushy}`)
        // }
        // // p(`\n// misc \n`)
        // // prettier-ignore
        // // for (const n of this.nodes) {
        // //     p(`    ${n.category}_${n.name} = (args: ${n.name}_input, uid?: rt.NodeUID) => new ${n.name}(this, uid, args)`)
        // // }
        // p(`}`)

        // p(`declare const WORKFLOW: (builder: (graph: ComfyGraph) => void) => void`)
        // b.writeTS('./src/core/Comfy.ts')
        // p(`declare const WORKFLOW: import("core/WorkflowFn").WorkflowType`)
        return b.content
    }

    private toTSType = (t: string) => (ComfyPrimitiveMapping[t] ? `${ComfyPrimitiveMapping[t]} | Slot<'${t}'>` : `Slot<'${t}'>`)
}

export class ComfyNodeSchema {
    /** list of types the node has a single output of */
    singleOuputs: NodeOutputExt[] = []

    constructor(
        //
        public nameInComfy: string,
        public nameInCushy: string,
        public category: string,
        public inputs: NodeInputExt[],
        public outputs: NodeOutputExt[],
    ) {
        this.category = this.category.replaceAll('/', '_')
    }

    codegen(): string {
        const b = new CodeBuffer()
        const p = b.w

        // single type interfaces
        let x: { [key: string]: number } = {}
        for (const i of this.outputs) x[i.typeName] = (x[i.typeName] ?? 0) + 1
        this.singleOuputs = this.outputs.filter((i) => x[i.typeName] === 1)
        const ifaces = this.singleOuputs.map((i) => `HasSingle_${i.typeName}`)
        ifaces.push(`ComfyNode<${this.nameInCushy}_input>`)
        // inputs
        // p(`\n// ${this.name} -------------------------------`)
        // const msgIfDifferent = this.nameInComfy !== this.nameInCushy ? ` ("${this.nameInComfy}" in ComfyUI)` : ''
        p(`// ${this.nameInComfy} [${this.category}]`)
        p(`export interface ${this.nameInCushy} extends ${ifaces.join(', ')} {`)
        p(`    nameInComfy: "${this.nameInComfy}"`)
        // p(`    $schema: ${this.name}_schema`)
        this.outputs.forEach((i, ix) => {
            p(`    ${escapeJSKey(i.nameInCushy)}: Slot<'${i.typeName}', ${ix}>,`)
        })
        // INTERFACE
        // if (x[i.type] === 1) p(`    get _${i.type}() { return this.${i.name} } // prettier-ignore`)
        // }
        // CLASS END
        p(`}`)

        // p(`// prettier-ignore`)
        // p(`export const ${this.name}_schema: ComfyNodeSchema = {`)
        // p(`    type: '${this.name}',`)
        // p(`    input: ${JSON.stringify(this.inputs)},`)
        // p(`    outputs: ${JSON.stringify(this.outputs)},`)
        // p(`    category: ${JSON.stringify(this.category)},`)
        // p(`}`)

        p(`export interface ${this.nameInCushy}_input {`)
        for (const i of this.inputs) {
            const opts = typeof i.opts === 'string' ? null : i.opts
            const type = /*ComfyPrimitiveMapping[i.type] //
                ? i.type
                : */ i.type.startsWith('Enum_') ? i.type : `_${i.type}`
            if (opts) p(`    ${this.renderOpts(opts)}`)
            const canBeOmmited = opts?.default !== undefined || !i.required
            p(`    ${i.nameInComfyEscaped}${canBeOmmited ? '?' : ''}: ${type}`)
        }
        p(`}`)

        return b.content
    }

    renderOpts(opts?: ComfyInputOpts): Maybe<string> {
        if (opts == null) return null
        if (typeof opts === 'string') return null
        let out = '/**'
        if (opts.default != null)
            out +=
                this.nameInCushy === 'WASCacheNode' //
                    ? ` default='<redacted>'`
                    : ` default=${JSON.stringify(opts.default)}`
        if (opts.min != null) out += ` min=${JSON.stringify(opts.max)}`
        if (opts.max != null) out += ` max=${JSON.stringify(opts.max)}`
        if (opts.step != null) out += ` step=${JSON.stringify(opts.step)}`
        out += ' */'
        return out
    }
}

export const wrapQuote = (s: string) => {
    if (s.includes("'")) return `"${s}"`
    return `'${s}'`
}
