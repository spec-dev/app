import ensProfileInterface from './ens-profile'
import nftInterface from './nft'
import nftAssetInterface from './nft-asset'
import nftSaleInterface from './nft-sale'
import listingInterface from './listing'
import compoundMarketAPYInterface from './compound-market-apy'
import compoundMarketAPYExampleData from './compound-market-apy-example-data'
import nftSaleExampleData from './nft-sale-example-data'
import nftAssetExampleData from './nft-asset-example-data'
import ensProfileExampleData from './ens-profile-example-data'

const ensProfileSpec = {
	name: 'ENS Profile',
	typeDef: {
		name: 'ENSProfile',
		properties: [
			{
				name: 'address',
				type: 'string',
				desc: 'The address of the ENS domain\'s owner.',
                linkRequired: true,
			},
			{
				name: 'domain',
				type: 'string',
				desc: 'The ENS domain (i.e. vitalik.eth).'
			},
			{
				name: 'textRecords',
				type: 'hash',
				desc: 'Text records associated with the domain.'
			},
		],
		code: ensProfileInterface,
        exampleData: ensProfileExampleData
	},
}

const nftSpec = {
	name: 'NFT',
	typeDef: {
		name: 'NFT',
		properties: [
			{
				name: 'collection',
				type: 'string',
				desc: 'The name of the NFT collection.'
			},
			{
				name: 'ownerAddress',
				type: 'string',
				desc: 'The address of the NFT\'s owner.',
                linkRequired: true,
			},
			{
				name: 'contractAddress',
				type: 'string',
				desc: 'The address of the NFT\'s contract.',
                linkRequired: true,
			},
			{
				name: 'tokenId',
				type: 'number',
				desc: 'The NFT\'s id.',
                linkRequired: true,
			},
			{
				name: 'tokenURI',
				type: 'string',
				desc: 'The URI hosting the NFT\'s metadata.'
			},
			{
				name: 'chain',
				type: 'string',
				desc: 'The blockchain associated with the NFT.'
			},
			{
				name: 'standard',
				type: 'string',
				desc: 'The standard of the NFT (ERC-721 or ERC-1155).'
			},
			{
				name: 'metadata',
				type: 'hash',
				desc: 'The NFT\'s metadata object.'
			},
		],
		code: nftInterface,
	},
}

const aaveUserPositionSpec = {
	name: 'Aave User Position',
	typeDef: {
		name: 'AaveUserPosition',
		properties: [
			{
				name: 'address',
				type: 'string',
				desc: 'The address of the Aave user.',
                linkRequired: true,
			},
			{
				name: 'asset',
				type: 'string',
				desc: 'The name of the Aave asset.',
				linkRequired: true,
			},
			{
				name: 'deposited',
				type: 'number',
				desc: 'The user\'s current aToken balance (in ETH)',
			},
			{
				name: 'stableDebt',
				type: 'number',
				desc: 'The user\'s current stable debt (in ETH)',
			},
			{
				name: 'variableDebt',
				type: 'number',
				desc: 'The user\'s current variable debt (in ETH)',
			},
		],
		code: ensProfileInterface,
	},
}

const listingSpec = {
	name: 'Listing',
	typeDef: {
		name: 'Listing',
		properties: [
			{
				name: 'contractAddress',
				type: 'string',
				desc: 'Address of the marketplace contract.',
				linkRequired: true,
			},
			{
				name: 'listingId',
				type: 'number',
				desc: 'The uid for the listing.',
				linkRequired: true,
			},
			{
				name: 'listingType',
				type: 'string',
				desc: 'The type of listing (direct listing or auction).'
			},
			{
				name: 'assetContract',
				type: 'string',
				desc: 'The contract address of the NFT to list for sale.',
			},
			{
				name: 'tokenOwner',
				type: 'string',
				desc: 'The owner address of the tokens listed for sale.'
			},
			{
				name: 'tokenId',
				type: 'number',
				desc: 'The tokenId on the assetContract of the NFT to list for sale.'
			},
			{
				name: 'tokenType',
				type: 'string',
				desc: 'The type of the token(s) listed for for sale (ERC721 or ERC1155)'
			},
			{
				name: 'startTime',
				type: 'Date',
				desc: 'The unix timestamp after which the listing is active.'
			},
			{
				name: 'endTime',
				type: 'Date',
				desc: 'The unix timestamp after which the listing is inactive.'
			},
			{
				name: 'quantity',
				type: 'number',
				desc: 'The quantity of NFTs listed (always 1 for ERC-721s).'
			},
			{
				name: 'currency',
				type: 'string',
				desc: 'Currency in which buyers or bidders must transact with.'
			},
			{
				name: 'reservePricePerToken',
				type: 'number',
				desc: 'Minimum bid amount of the auction.',
			},
			{
				name: 'buyoutPricePerToken',
				type: 'number',
				desc: 'Price per token (if direct listing).'
			},
			{
				name: 'removed',
				type: 'boolean',
				desc: 'Whether the listing was removed by the lister.'
			},		
		],
		code: listingInterface,
	},
}

const nftAssetSpec = {
	name: 'NFTAsset',
	typeDef: {
		name: 'NFTAsset',
		properties: [
			{
				name: 'collection',
				type: 'string',
				desc: 'The name of the NFT collection.'
			},
			{
				name: 'contractAddress',
				type: 'string',
				desc: 'The address of the NFT\'s contract.',
                linkRequired: true,
			},
			{
				name: 'tokenId',
				type: 'number',
				desc: 'The NFT\'s id.',
                linkRequired: true,
			},
			{
				name: 'ownerAddress',
				type: 'string',
				desc: 'The address of the NFT\'s owner.',
			},
			{
				name: 'tokenURI',
				type: 'string',
				desc: 'The URI hosting the NFT\'s metadata.'
			},
			{
				name: 'chain',
				type: 'string',
				desc: 'The blockchain associated with the NFT.'
			},
			{
				name: 'standard',
				type: 'string',
				desc: 'The standard of the NFT (erc721 or erc1155).'
			},
			{
				name: 'metadata',
				type: 'hash',
				desc: 'The NFT\'s metadata object.'
			},
		],
		code: nftAssetInterface,
		exampleData: nftAssetExampleData,
	},
}

const nftSaleSpec = {
	name: 'NFTSale',
	typeDef: {
		name: 'NFTSale',
		properties: [
			{
				name: 'collection',
				type: 'string',
				desc: 'The name of the NFT collection.'
			},
			{
				name: 'contractAddress',
				type: 'string',
				desc: 'The address of the NFT\'s contract.',
                linkRequired: true,
			},
			{
				name: 'tokenId',
				type: 'number',
				desc: 'The NFT\'s id.',
                linkRequired: true,
			},
			{
				name: 'seller',
				type: 'string',
				desc: 'The address of the seller.',
			},
			{
				name: 'buyer',
				type: 'string',
				desc: 'The address of the buyer.',
			},
			{
				name: 'priceETH',
				type: 'number',
				desc: 'The sale price of the NFT, in ETH.'
			},
			{
				name: 'priceUSD',
				type: 'number',
				desc: 'The sale price of the NFT, in USD.'
			},
			{
				name: 'datetime',
				type: 'Date',
				desc: 'The datetime of when the sale occurred.'
			},
			{
				name: 'marketplace',
				type: 'string',
				desc: 'The marketplace on which the NFT was sold.'
			},
			{
				name: 'blockNumber',
				type: 'number',
				desc: 'The block number in which the transaction occurred.',
			},
			{
				name: 'transactionHash',
				type: 'string',
				desc: 'The NFT transfer transaction hash.',
			},
		],
		code: nftSaleInterface,
		exampleData: nftSaleExampleData,
	},
}

const compoundMarketAPYSpec = {
	name: 'CompoundMarketAPY',
	typeDef: {
		name: 'CompoundMarketAPY',
		properties: [
			{
				name: 'name',
				type: 'string',
				desc: 'The name this APY data is associated with.',
				linkRequired: true,
			},
			{
				name: 'contractAddress',
				type: 'string',
				desc: 'The address of the name contract.',
			},
			{
				name: 'supplyAPY',
				type: 'number',
				desc: 'The current APY (%) for supplying in this market.',
			},
			{
				name: 'borrowAPY',
				type: 'string',
				desc: 'The current APY (%) for borrowing in this market.',
			},
			{
				name: 'blockNumber',
				type: 'string',
				desc: 'The block number the APY data is associated with.',
			},
		],
		code: compoundMarketAPYInterface,
		exampleData: compoundMarketAPYExampleData,
	},
}

const specs = {
	[ensProfileSpec.typeDef.name]: ensProfileSpec,
	[nftSpec.typeDef.name]: nftSpec,
	[aaveUserPositionSpec.typeDef.name]: aaveUserPositionSpec,
	[listingSpec.typeDef.name]: listingSpec,

	// New
	[nftAssetSpec.typeDef.name]: nftAssetSpec,
	[nftSaleSpec.typeDef.name]: nftSaleSpec,
	[compoundMarketAPYSpec.typeDef.name]: compoundMarketAPYSpec,
}

export {
	specs,
	nftSpec,
	ensProfileSpec,
	aaveUserPositionSpec,
	listingSpec,

	// New
	nftAssetSpec,
	nftSaleSpec,
	compoundMarketAPYSpec,
}