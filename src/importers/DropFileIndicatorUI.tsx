import { observer } from 'mobx-react-lite'
import { Subtitle2 } from '../ui/Text'
import { Loader } from 'rsuite'

export const DropFileIndicatorUI = observer(function DropFileIndicatorUI_(p: {}) {
    return (
        <>
            <Subtitle2>Drop file(s) here</Subtitle2>
            <Loader />
        </>
    )
})