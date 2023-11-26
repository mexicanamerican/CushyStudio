import type { SchemaL } from 'src/models/Schema'
import * as W from './Widget'
import { exhaust } from 'src/utils/misc/ComfyUtils'
import { makeAutoObservable } from 'mobx'
import { _FIX_INDENTATION } from '../utils/misc/_FIX_INDENTATION'

// prettier-ignore
export class FormBuilder {

    /** (@internal) don't call this yourself */
    constructor(public schema: SchemaL) {
        makeAutoObservable(this)
    }

    // autoUI          =                                                  (p: Widget_str_input                  ) => new Widget_str                   (this, this.schema, p)
    string             =                                                  (p: W.Widget_str_input                ) => new W.Widget_str                 (this, this.schema, p)
    color              =                                                  (p: W.Widget_color_input              ) => new W.Widget_color               (this, this.schema, p)
    size               =                                                  (p: W.Widget_size_input               ) => new W.Widget_size                (this, this.schema, p)
    stringOpt          =                                                  (p: W.Widget_strOpt_input             ) => new W.Widget_strOpt              (this, this.schema, p)
    str                =                                                  (p: W.Widget_str_input                ) => new W.Widget_str                 (this, this.schema, p)
    strOpt             =                                                  (p: W.Widget_strOpt_input             ) => new W.Widget_strOpt              (this, this.schema, p)
    prompt             =                                                  (p: W.Widget_prompt_input             ) => new W.Widget_prompt              (this, this.schema, p)
    promptOpt          =                                                  (p: W.Widget_promptOpt_input          ) => new W.Widget_promptOpt           (this, this.schema, p)
    seed               =                                                  (p: W.Widget_seed_input               ) => new W.Widget_seed                (this, this.schema, p)
    int                =                                                  (p: W.Widget_int_input                ) => new W.Widget_int                 (this, this.schema, p)
    intOpt             =                                                  (p: W.Widget_intOpt_input             ) => new W.Widget_intOpt              (this, this.schema, p)
    float              =                                                  (p: W.Widget_float_input              ) => new W.Widget_float               (this, this.schema, p)
    floatOpt           =                                                  (p: W.Widget_floatOpt_input           ) => new W.Widget_floatOpt            (this, this.schema, p)
    number             =                                                  (p: W.Widget_float_input              ) => new W.Widget_float               (this, this.schema, p)
    numberOpt          =                                                  (p: W.Widget_floatOpt_input           ) => new W.Widget_floatOpt            (this, this.schema, p)
    matrix             =                                                  (p: W.Widget_matrix_input             ) => new W.Widget_matrix              (this, this.schema, p)
    boolean            =                                                  (p: W.Widget_bool_input               ) => new W.Widget_bool                (this, this.schema, p)
    bool               =                                                  (p: W.Widget_bool_input               ) => new W.Widget_bool                (this, this.schema, p)
    loras              =                                                  (p: W.Widget_loras_input              ) => new W.Widget_loras               (this, this.schema, p)
    image              =                                                  (p: W.Widget_image_input              ) => new W.Widget_image               (this, this.schema, p)
    markdown           =                                                  (p: W.Widget_markdown_input           ) => new W.Widget_markdown            (this, this.schema, p)
    imageOpt           =                                                  (p: W.Widget_imageOpt_input           ) => new W.Widget_imageOpt            (this, this.schema, p)
    selectOneOrCustom  =                                                  (p: W.Widget_selectOneOrCustom_input  ) => new W.Widget_selectOneOrCustom   (this, this.schema, p)
    selectManyOrCustom =                                                  (p: W.Widget_selectManyOrCustom_input ) => new W.Widget_selectManyOrCustom  (this, this.schema, p)
    enum               = <const T extends KnownEnumNames>                 (p: W.Widget_enum_input<T>            ) => new W.Widget_enum                (this, this.schema, p)
    enumOpt            = <const T extends KnownEnumNames>                 (p: W.Widget_enumOpt_input<T>         ) => new W.Widget_enumOpt             (this, this.schema, p)
    list               = <const T extends W.Widget>                       (p: W.Widget_list_input<T>            ) => new W.Widget_list                (this, this.schema, p)
    listExt            = <const T extends W.Widget>                       (p: W.Widget_listExt_input<T>         ) => new W.Widget_listExt             (this, this.schema, p)
    timeline           = <const T extends W.Widget>                       (p: W.Widget_listExt_input<T>         ) => new W.Widget_listExt             (this, this.schema, { mode: 'timeline', ...p })
    regional           = <const T extends W.Widget>                       (p: W.Widget_listExt_input<T>         ) => new W.Widget_listExt             (this, this.schema, { mode: 'regional', ...p })
    groupOpt           = <const T extends { [key: string]: W.Widget }>    (p: W.Widget_groupOpt_input<T>        ) => new W.Widget_groupOpt            (this, this.schema, p)
    group              = <const T extends { [key: string]: W.Widget }>    (p: W.Widget_group_input<T>           ) => new W.Widget_group               (this, this.schema, p)
    selectOne          = <const T extends { id: string, label?: string}>  (p: W.Widget_selectOne_input<T>       ) => new W.Widget_selectOne           (this, this.schema, p)
    selectMany         = <const T extends { type: string}>                (p: W.Widget_selectMany_input<T>      ) => new W.Widget_selectMany          (this, this.schema, p)
    choice             = <const T extends { [key: string]: W.Widget }>    (p: W.Widget_choice_input<T>          ) => new W.Widget_choice              (this, this.schema, p)
    choices            = <const T extends { [key: string]: W.Widget }>    (p: W.Widget_choices_input<T>         ) => new W.Widget_choices             (this, this.schema, p)


    _FIX_INDENTATION = _FIX_INDENTATION

    /** (@internal); */
    _cache :{ count:number } = { count:0 }

    /** (@internal) will be set at builer creation, to allow for dyanmic recursive forms */
    _ROOT!: W.Widget_group<any>

    /** (@internal) advanced way to restore form state. used internally */
    _HYDRATE =(type: W.Widget['type'], input: any, serial?: any ): any => {
        if (type === 'bool')               return new W.Widget_bool               (this, this.schema, input, serial)
        if (type === 'str')                return new W.Widget_str                (this, this.schema, input, serial)
        if (type === 'strOpt')             return new W.Widget_strOpt             (this, this.schema, input, serial)
        if (type === 'int')                return new W.Widget_int                (this, this.schema, input, serial)
        if (type === 'seed')               return new W.Widget_seed               (this, this.schema, input, serial)
        if (type === 'intOpt')             return new W.Widget_intOpt             (this, this.schema, input, serial)
        if (type === 'float')              return new W.Widget_float              (this, this.schema, input, serial)
        if (type === 'floatOpt')           return new W.Widget_floatOpt           (this, this.schema, input, serial)
        if (type === 'matrix')             return new W.Widget_matrix             (this, this.schema, input, serial)
        if (type === 'prompt')             return new W.Widget_prompt             (this, this.schema, input, serial)
        if (type === 'promptOpt')          return new W.Widget_promptOpt          (this, this.schema, input, serial)
        if (type === 'loras')              return new W.Widget_loras              (this, this.schema, input, serial)
        if (type === 'image')              return new W.Widget_image              (this, this.schema, input, serial)
        if (type === 'imageOpt')           return new W.Widget_imageOpt           (this, this.schema, input, serial)
        if (type === 'selectOneOrCustom')  return new W.Widget_selectOneOrCustom  (this, this.schema, input, serial)
        if (type === 'selectManyOrCustom') return new W.Widget_selectManyOrCustom (this, this.schema, input, serial)
        if (type === 'enum')               return new W.Widget_enum               (this, this.schema, input, serial)
        if (type === 'enumOpt')            return new W.Widget_enumOpt            (this, this.schema, input, serial)
        if (type === 'list')               return new W.Widget_list               (this, this.schema, input, serial)
        if (type === 'listExt')            return new W.Widget_listExt            (this, this.schema, input, serial)
        if (type === 'groupOpt')           return new W.Widget_groupOpt           (this, this.schema, input, serial)
        if (type === 'group')              return new W.Widget_group              (this, this.schema, input, serial)
        if (type === 'selectOne')          return new W.Widget_selectOne          (this, this.schema, input, serial)
        if (type === 'selectMany')         return new W.Widget_selectMany         (this, this.schema, input, serial)
        if (type === 'size')               return new W.Widget_size               (this, this.schema, input, serial)
        if (type === 'color')              return new W.Widget_color              (this, this.schema, input, serial)
        if (type === 'choice')             return new W.Widget_choice             (this, this.schema, input, serial)
        if (type === 'choices')            return new W.Widget_choices            (this, this.schema, input, serial)
        if (type === 'markdown')           return new W.Widget_markdown           (this, this.schema, input, serial)
        console.log(`🔴 unknown type ${type}`)
        exhaust(type)
    }
}
