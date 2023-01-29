import React, { useState } from 'react';
import { getPCN, cn } from '../../../utils/classes'
import { previewIcon } from '../../../svgs/icons'

const className = 'interface-example-snippet'
const pcn = getPCN(className)

function InterfaceExampleSnippet(props) {
    const { exampleCode, interfaceCode } = props
    const [showExample, setShowExample] = useState(props.showExample || false)

    return (
        <div className={cn('snippet', className, `${className}--${showExample ? 'example' : 'interface'}`)}>
            <div
                className={pcn('__toggle-button')}
                onClick={() => setShowExample(!showExample)}>
                <div
                    className={pcn('__toggle-button-icon', '__toggle-button-icon--example')}
                    dangerouslySetInnerHTML={{ __html: previewIcon }}>    
                </div>
                <div
                    className={pcn('__toggle-button-icon', '__toggle-button-icon--interface')}>   
                    <span>{`{}`}</span> 
                </div>
            </div>
            <div className='snippet-liner'>
                <div
                    className='interface'
                    dangerouslySetInnerHTML={{ __html: showExample ? exampleCode : interfaceCode }}>    
                </div>
            </div>
        </div>
    )
}

export default InterfaceExampleSnippet