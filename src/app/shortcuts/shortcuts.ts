import type { STATE } from 'src/state/state'
import { CushyShortcut, Shortcut } from './ShortcutManager'
import { Trigger } from './Trigger'
import { TreeUIKeyboardNavigableRootID } from 'src/panels/libraryUI/tree/xxx/TreeUIKeyboardNavigableRootID'
import { runInAction } from 'mobx'

// ------------------------------------------------------------------------------------
// basic utils
const always = (fn: (st: STATE) => any) => (st: STATE) => {
    fn(st)
    return Trigger.Success
}

const simple = (shortcut: CushyShortcut | CushyShortcut[], action: (fn: STATE) => void): Shortcut<STATE> => ({
    combos: Array.isArray(shortcut) ? shortcut : [shortcut],
    action: always(action),
})

const simpleValidInInput = (combo: CushyShortcut | CushyShortcut[], action: (fn: STATE) => void): Shortcut<STATE> => ({
    combos: Array.isArray(combo) ? combo : [combo],
    action: always(action),
    validInInput: true,
})

// ------------------------------------------------------------------------------------
// core global shortcuts
export const shortcutsDef: Shortcut<STATE>[] = [
    // simpleValidInInput('mod+shift+k', (st) => (st.showSuperAdmin = !st.showSuperAdmin)),
    // simpleValidInInput('mod+shift+z', (st) => (st.showSuperAdminBubbles = !st.showSuperAdminBubbles)),
    simpleValidInInput(['mod+2'], (st) => {
        runInAction(() => {
            const node = st.layout.FOCUS_OR_CREATE('FileList', {})
            setImmediate(() => {
                const isVisible = node?.isVisible()
                if (!isVisible) return console.log(`[👙] not visible`)
                const item = window.document.getElementById(TreeUIKeyboardNavigableRootID)
                if (item == null) return console.log(`[👙] dom node #${TreeUIKeyboardNavigableRootID} not found`)
                item.focus()
            })
        })
    }),
    // --------------------------
    // menu utils:
    simpleValidInInput(['mod+k 1'], (st) => st.layout.FOCUS_OR_CREATE('Civitai', {})),
    simpleValidInInput(['mod+k 2'], (st) => st.layout.FOCUS_OR_CREATE('Squoosh', {})),
    simpleValidInInput(['mod+k 3'], (st) => st.layout.FOCUS_OR_CREATE('IFrame', { url: 'https://app.posemy.art/' })),
    simpleValidInInput(['mod+k 4'], (st) => st.layout.FOCUS_OR_CREATE('Paint', {})),
    simpleValidInInput(['mod+k 5'], (st) => st.layout.FOCUS_OR_CREATE('IFrame', { url: 'https://unsplash.com/' })),

    // menu settings --------------------------
    simpleValidInInput(['mod+,'], (st) => st.layout.FOCUS_OR_CREATE('Config', {})),
    simpleValidInInput(['mod+shift+,'], (st) => st.layout.FOCUS_OR_CREATE('Hosts', {})),

    // --------------------------
    simpleValidInInput(['mod+1', 'mod+p', 'mod+j'], (st) => st.toggleFullLibrary()),
    simpleValidInInput(['mod+escape'], (st) => st.closeFullLibrary()),
    // simpleValidInInput(['mod+2'], (st) => st.layout.addMarketplace()),
    simpleValidInInput(['mod+3'], (st) => st.layout.FOCUS_OR_CREATE('Paint', {})),
    simpleValidInInput(['mod+4'], (st) => st.layout.FOCUS_OR_CREATE('ComfyUI', {})),
    simpleValidInInput(['mod+5'], (st) => st.layout.FOCUS_OR_CREATE('Gallery', {})),
    simpleValidInInput(['mod+6'], (st) => st.layout.FOCUS_OR_CREATE('Config', {})),
    simpleValidInInput(['mod+7'], (st) => st.layout.FOCUS_OR_CREATE('Civitai', {})),
    simpleValidInInput(['mod+8'], (st) => st.layout.FOCUS_OR_CREATE('Hosts', {})),
    // simple('mod+x s', (st) => st.auth.stopImpersonating()),
    // simple('mod+x q', (st) => st.auth.logOut()),

    // T   - Toogle
    // { combos: ['t a m'], action: (st) => Trigger.UNMATCHED_CONDITIONS, info: 'Tooggle Automation Menu' },
    // { combos: ['t a p'], action: (st) => Trigger.UNMATCHED_CONDITIONS, info: 'Tooggle Automation Preview' },
    {
        combos: ['mod+w'],
        validInInput: true,
        action: (st) => st.layout.closeCurrentTab(),
        info: 'Tooggle Graph Monitor',
    },

    {
        combos: ['escape'],
        validInInput: true,
        action: (st) => {
            if (st.layout.fullPageComp == null) return Trigger.UNMATCHED_CONDITIONS
            st.layout.fullPageComp = null
            return Trigger.Success
        },
        info: 'Close Full-Screen Panel if open',
    },

    // G   - Go
    // G M - Go Messagerie
    // { combos: ['g m'], action: (st) => st.router.goTo('CHAT', { inbox: { filter: 'all' } }) }, // Messagerie   | Appbar
    // { combos: ['g m s'], action: (st) => st.router.goTo('CHAT_NEW', {}) }, //         Messagerie   | Appbar
    // { combos: 'cmd+k cmd+s', action: () => {} },
    // { combos: 'cmd+k cmd+s', action: () => {} },
]
