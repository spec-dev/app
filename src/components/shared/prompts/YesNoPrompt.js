import React, { useCallback, useState, useEffect } from 'react'
import { getPCN, cn } from '../../../utils/classes'
import { helpIcon, checkIcon } from '../../../svgs/icons'
import { noop } from '../../../utils/nodash'

const className = 'yes-no-prompt'
const pcn = getPCN(className)

export const promptLevels = {
    INFO: 0,
}

function YesNoPrompt(props) {
    const {
        title,
        subtitle,
        level,
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
        <div className={cn('prompt', className, `prompt--${level}`)}>
            <div className='prompt-liner'>
                <div className='prompt-main'>
                    <div className='prompt-main-top'>
                        <div
                            className='prompt-icon'
                            dangerouslySetInnerHTML={{ __html: helpIcon }}>
                        </div>
                        <div className='prompt-title'>{title}</div>
                    </div>
                    <div className='prompt-main-bottom'>
                        <div className='prompt-subtitle'>{subtitle}</div>
                    </div>
                </div>
                <div className='prompt-buttons-container'>
                    <div className={pcn('__buttons')}>
                        <div className={pcn('__button')} onClick={onNo}>
                            <span>No</span>
                        </div>
                        <div
                            className={pcn(
                                '__button', 
                                added ? `__button--added` : '',
                                animateToAdded ? `__button--animate` : '',
                            )}
                            onClick={onClickYes}>
                            <span>Yes</span>
                            <div dangerouslySetInnerHTML={{ __html: checkIcon }}>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default YesNoPrompt