import React, { useCallback } from 'react'
import { getPCN } from '../../../utils/classes'
import { chainNames, chainIds } from '../../../utils/chains'
import { noop } from '../../../utils/nodash'

const className = 'chain-filter-buttons'
const pcn = getPCN(className)

const orderedChainIds = [
    chainIds.ETHEREUM,
    chainIds.POLYGON,
    chainIds.GOERLI,
    chainIds.MUMBAI,
]

const options = [
    {
        title: 'All',
        value: null,
    },
    ...orderedChainIds.map(chainId => ({
        title: chainNames[chainId],
        value: chainId,
    }))
]

function ChainFilterButtons(props) {
    const selectedChainIds = props.selectedChainIds || []
    const onChangeSelection = props.onChangeSelection || noop

    const onClickButton = useCallback((value) => {
        // Selected all
        if (!value) {
            onChangeSelection([])
            return
        }

        // Toggle chain id from selection
        const currentChainIdsSet = new Set(selectedChainIds)
        currentChainIdsSet.has(value) ? currentChainIdsSet.delete(value) : currentChainIdsSet.add(value)
        onChangeSelection(Array.from(currentChainIdsSet))
    }, [onChangeSelection, selectedChainIds])

    const renderButtons = useCallback(() => options.map(({ title, value }) => {
        const isAllButton = value === null
        const hasAtLeastOneChainSelected = !!selectedChainIds.length
        const showAsSelected = (isAllButton && !hasAtLeastOneChainSelected) || value && selectedChainIds.includes(value)
        return (
            <span
                key={title}
                className={pcn('__button', showAsSelected ? '__button--selected' : '')}
                onClick={() => onClickButton(value)}>
                { title }
            </span>
        )
    }), [selectedChainIds, onClickButton])

    return (
        <div className={className}>
            <div className={pcn('__liner')}>
                { renderButtons() }
            </div>
        </div>
    )
}

export default ChainFilterButtons