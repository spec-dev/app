import React, { useCallback, useRef } from 'react'
import { cn, getPCN } from '../../utils/classes'
import { liveObjectsSubSections } from '../../utils/nav'
import LiveObjectsEcosystem from './LiveObjectsEcosystem'
import LiveObjectPage from './LiveObjectPage'
import LiveObjectDataFlow from './LiveObjectDataFlow'
import Slider from '../shared/sliders/Slider'
import TransformPanel from '../shared/panels/TransformPanel'
import FunctionPanel from '../shared/panels/FunctionPanel'

const className = 'live-objects-body'
const pcn = getPCN(className)

function LiveObjectsBody(props) {
    const { currentSubSection, currentMod } = props
    const transformSliderRef = useRef()
    const functionSliderRef = useRef()

    const showTransformSlider = useCallback(() => {
        transformSliderRef.current?.show()
    }, [])

    const showFunctionSlider = useCallback(() => {
        functionSliderRef.current?.show()
    }, [])

    const renderContent = useCallback(() => {
        switch (currentSubSection) {
            case liveObjectsSubSections.OBJECT_ECOSYSTEM:
                return <LiveObjectsEcosystem/>
            default:
                return currentMod === 'flow'
                    ? <LiveObjectDataFlow onShowTransform={showTransformSlider} onShowFunction={showFunctionSlider}/>
                    : <LiveObjectPage/>
        }
    }, [currentSubSection, currentMod])

    return (
        <div className={cn(className, `${className}--${currentMod === 'flow' ? 'flow' : currentSubSection}`)}>
            { renderContent() }
            <Slider
                id='transformSlider'
                ref={transformSliderRef}>
                <TransformPanel
                    onCancel={() => transformSliderRef.current?.hide()}
                />
            </Slider>
            <Slider
                id='functionSlider'
                ref={functionSliderRef}>
                <FunctionPanel
                    onCancel={() => functionSliderRef.current?.hide()}
                />
            </Slider>
        </div>
    )
}

export default LiveObjectsBody