import React, { useCallback, useState, useEffect } from 'react'
import { getPCN, cn } from '../../../utils/classes'
import { helpIcon, checkIcon } from '../../../svgs/icons'
import { noop } from '../../../utils/nodash'

const className = 'add-foreign-key-prompt'
const pcn = getPCN(className)

function AddForeignKeyPrompt(props) {
    const {
        onYes = noop,
        onNo = noop,
    } = props
    const [added, setAdded] = useState(false)
    const [animateToAdded, setAnimateToAdded] = useState(false)

    useEffect(() => {
        if (added && !animateToAdded) {
            setAnimateToAdded(true)
        }
    }, [added, animateToAdded])

    const onClickYes = useCallback(() => { 
        setAdded(true)
        onYes()
    }, [onYes])

    return (
        <div className={cn('prompt', className, `prompt--0`)}>
            <div className='prompt-liner'>
                <div className='prompt-main'>
                    <div className='prompt-main-top'>
                        <div
                            className='prompt-icon'
                            dangerouslySetInnerHTML={{ __html: helpIcon }}>
                        </div>
                        <div className='prompt-title'>
                            Add foreign key?
                        </div>
                    </div>
                    <div className='prompt-main-bottom'>
                        <div className='prompt-subtitle'>
                            This is optional and won't affect filtering, but it could improve join-query performance.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AddForeignKeyPrompt