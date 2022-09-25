
const readAllRows = `<div class="editor__v-scroll">
    <div class="editor__h-scroll">
        <span class="line"><span class="keyword">const</span><span class="default"> { data: wallets, error } = </span><span class="keyword">await</span><span class="default"> spec</span></span><br/>
        <span class="line"><span class="tab"></span><span class="default">.</span><span class="function-call">from</span><span class="default">(</span><span class="string">'wallets'</span><span class="default">)</span></span><br/>
        <span class="line"><span class="tab"></span><span class="default">.</span><span class="function-call">select</span><span class="default">(</span><span class="string">'*'</span><span class="default">)</span></span><br/>
    </div>
</div>`

const specificColumns = readAllRows

const withFilters = readAllRows

const foreignTables = readAllRows

const subscribeToUpdates = `<div class="editor__v-scroll">
    <div class="editor__h-scroll">
        <span class="line"><span class="default">spec.</span><span class="function-call">from</span><span class="default">(</span><span class="string">'aave_positions'</span><span class="default">).</span><span class="function-call">onUpdate</span><span class="default">(event =&gt; {</span></span><br/>
        <span class="line"><span class="tab"></span><span class="default">console.</span><span class="function-call">log</span><span class="default">(event)</span></span><br/>
        <span class="line"><span class="default">})</span></span><br/>
    </div>
</div>`

const eventOutput = `<div class="output">
    <span class="line"><span class="default">{</span></span><br/>
    <span class="line"><span class="tab"></span><span class="default">eventType: </span><span class="string">'{{event}}'</span><span class="default">,</span></span><br/>
    <span class="line"><span class="tab"></span><span class="default">timestamp: </span><span class="string">'{{timestamp}}'</span><span class="default">,</span></span><br/>
    <span class="line"><span class="tab"></span><span class="default">schema: </span><span class="string">'public'</span><span class="default">,</span></span><br/>
    <span class="line"><span class="tab"></span><span class="default">table: </span><span class="string">'{{table}}'</span><span class="default">,</span></span><br/>
    <span class="line"><span class="tab"></span><span class="default">new: </span>{{new}}<span class="default">,</span></span><br/>
    <span class="line"><span class="tab"></span><span class="default">old: </span>{{old}}<span class="default">,</span></span><br/>
    <span class="line"><span class="default">}</span></span><br/>
</div>`

const aavePosition = `<span class="default">{ }</span>`

const transformExample = `<div class="editor__v-scroll">
    <div class="editor__line-numbers">
        <span>1</span><br/>
        <span>2</span><br/>
        <span>3</span><br/>
        <span>4</span><br/>
        <span>5</span><br/>
        <span>6</span><br/>
        <span>7</span><br/>
        <span>8</span><br/>
        <span>9</span><br/>
        <span>10</span><br/>
        <span>11</span><br/>
        <span>12</span><br/>
        <span>13</span><br/>
        <span>14</span><br/>
        <span>15</span><br/>
        <span>16</span><br/>
        <span>17</span><br/>
        <span>18</span><br/>
        <span>19</span><br/>
        <span>20</span><br/>
        <span>21</span><br/>
        <span>22</span><br/>
        <span>23</span><br/>
        <span>24</span><br/>
        <span>25</span><br/>
    </div>
    <div class="editor__h-scroll">
        <span class="line"><span class="keyword">import</span> { ListingAdded } <span class="keyword">from </span><span class="string">'@spec.contracts/thirdweb/events'</span>;</span><br/>
        <span class="line"><span class="keyword">import</span> { ListingChanged, Listing } <span class="keyword">from </span><span class="string">'../types'</span>;</span><br/>
        <span class="line"><span class="keyword">import</span> { unixTsToDate } <span class="keyword">from </span><span class="string">'../shared'</span>;</span><br/>
        <span class="line"><span><span></span><br/>
        <span class="line"><span class="keyword">async function </span><span class="function-call"> transform</span>(event: <span class="type">ListingAdded</span>): <span class="type">Promise</span>&lt;<span class="type">ListingChanged</span>&gt; {</span><br/>
        <span class="line"><span class="tab"></span><span class="keyword">const</span> rawListing = event.data.listing</span><br/>
        <span class="line"><span><span></span><br/>
        <span class="line"><span class="tab"></span><span class="keyword">const</span> listing: <span class="type">Listing</span> = {</span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span>...rawListing,</span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span>contractAddress: event.source.address,</span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span>listingType: rawListing.listingType ? <span class="string">'auction'</span> : <span class="string">'direct'</span>,</span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span>tokenType: rawListing.tokenType ? <span class="string">'erc721'</span> : <span class="string">'erc1155'</span>,</span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span>startTime: <span class="function-call">unixTsToDate</span>(rawListing.startTime),</span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span>endTime: <span class="function-call">unixTsToDate</span>(rawListing.endTime),</span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span>removed: <span class="keyword">false</span>,</span><br/>
        <span class="line"><span class="tab"></span>}</span><br/>
        <span class="line"><span><span></span><br/>
        <span class="line"><span class="tab"></span><span class="keyword">return</span> {</span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span>...event,</span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span>name: <span class="string">ListingChanged</span>,</span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span>data: listing,</span><br/>
        <span class="line"><span class="tab"></span>}</span><br/>
        <span class="line">}</span><br/>
        <span class="line"><span><span></span><br/>
        <span class="line"><span class="keyword">export default</span><span class="function-call"> transform</span></span><br/>
    </div>
</div>`

const transformObjectExample = `<div class="editor__v-scroll">
    <div class="editor__line-numbers">
        <span>1</span><br/>
        <span>2</span><br/>
        <span>3</span><br/>
        <span>4</span><br/>
        <span>5</span><br/>
        <span>6</span><br/>
        <span>7</span><br/>
        <span>8</span><br/>
        <span>9</span><br/>
        <span>10</span><br/>
        <span>11</span><br/>
        <span>12</span><br/>
        <span>13</span><br/>
        <span>14</span><br/>
        <span>15</span><br/>
        <span>16</span><br/>
        <span>17</span><br/>
        <span>18</span><br/>
        <span>19</span><br/>
        <span>20</span><br/>
        <span>21</span><br/>
        <span>22</span><br/>
        <span>23</span><br/>
        <span>24</span><br/>
        <span>25</span><br/>
    </div>
    <div class="editor__h-scroll">
        <span class="line"><span class="keyword">import</span> { NFTAsset } <span class="keyword">from </span><span class="string">'@spec.types/nft-asset'</span>;</span><br/>
        <span class="line"><span><span></span><br/>
        <span class="line"><span class="keyword">interface</span><span class="type"> MyCustomObject </span><span class="default">{</span></span><br/>
        <span class="line"><span class="tab"></span><span class="default">collection: </span><span class="type">string</span></span><br/>
        <span class="line"><span class="tab"></span><span class="default">contractAddress: </span><span class="type">string</span></span><br/>
        <span class="line"><span class="tab"></span><span class="default">tokenId: </span><span class="type">number</span></span><br/>
        <span class="line"><span class="tab"></span><span class="default">ownerAddress: </span><span class="type">string</span></span><br/>
        <span class="line"><span class="tab"></span><span class="default">tokenURI: </span><span class="type">string</span></span><br/>
        <span class="line"><span class="tab"></span><span class="default">chain: </span><span class="type">string</span></span><br/>
        <span class="line"><span class="tab"></span><span class="default">standard: </span><span class="type">string</span></span><br/>
        <span class="line"><span class="tab"></span><span class="default">metadata: {</span></span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span><span class="default">[key: </span><span class="type">string</span><span class="default">]: </span><span class="type">string</span></span><br/>
        <span class="line"><span class="tab"></span><span class="default">}</span></span><br/>
        <span class="line"><span class="default">}</span></span><br/>
        <span class="line"><span><span></span><br/>
        <span class="line"><span class="keyword">async function </span><span class="function-call"> transform</span>(</span><br/>
        <span class="line"><span class="tab"></span>nftAsset: <span class="type">NFTAsset</span></span><br/>
        <span class="line">): <span class="type">Promise</span>&lt;<span class="type">MyCustomObject</span>&gt; {</span><br/>
        <span class="line"><span class="tab"></span><span class="comment">// Transform NFTAsset into MyCustomObject.</span></span><br/>
        <span class="line">}</span><br/>
    </div>
</div>`

const functionExample = `<div class="editor__v-scroll">
    <div class="editor__line-numbers">
        <span>1</span><br/>
        <span>2</span><br/>
        <span>3</span><br/>
        <span>4</span><br/>
        <span>5</span><br/>
        <span>6</span><br/>
        <span>7</span><br/>
        <span>8</span><br/>
        <span>9</span><br/>
        <span>10</span><br/>
        <span>11</span><br/>
        <span>12</span><br/>
        <span>13</span><br/>
        <span>14</span><br/>
        <span>15</span><br/>
        <span>16</span><br/>
        <span>17</span><br/>
        <span>18</span><br/>
        <span>19</span><br/>
    </div>
    <div class="editor__h-scroll">
        <span class="line"><span class="keyword">import</span> { marketplace } <span class="keyword">from </span><span class="string">'@spec.contracts/thirdweb'</span>;</span><br/>
        <span class="line"><span class="keyword">import</span> { Listing } <span class="keyword">from </span><span class="string">'../types'</span>;</span><br/>
        <span class="line"><span class="keyword">import</span> { unixTsToDate } <span class="keyword">from </span><span class="string">'../shared'</span>;</span><br/>
        <span class="line"><span><span></span><br/>
        <span class="line"><span class="keyword">async function </span><span class="function-call"> getListing</span>(contractAddress: <span class="type">string</span>, id: <span class="type">number</span>): <span class="type">Promise</span>&lt;<span class="type">Listing</span>&gt; {</span><br/>
        <span class="line"><span class="tab"></span><span class="keyword">const</span> { data: rawListing } = <span class="keyword">await</span><span class="function-call"> marketplace</span>(contractAddress).<span class="function-call">listings</span>(id)</span><br/>
        <span class="line"><span><span></span><br/>
        <span class="line"><span class="tab"></span><span class="keyword">return</span> {</span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span>...rawListing,</span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span>contractAddress,</span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span>listingType: rawListing.listingType ? <span class="string">'auction'</span> : <span class="string">'direct'</span>,</span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span>tokenType: rawListing.tokenType ? <span class="string">'erc721'</span> : <span class="string">'erc1155'</span>,</span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span>startTime: <span class="function-call">unixTsToDate</span>(rawListing.startTime),</span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span>endTime: <span class="function-call">unixTsToDate</span>(rawListing.endTime),</span><br/>
        <span class="line"><span class="tab"></span><span class="tab"></span>removed: <span class="keyword">false</span>,</span><br/>
        <span class="line"><span class="tab"></span>}</span><br/>
        <span class="line">}</span><br/>
        <span class="line"><span><span></span><br/>
        <span class="line"><span class="keyword">export default</span><span class="function-call"> getListing</span></span><br/>
    </div>
</div>`

export default {
    eventOutput,
    readAllRows,
    specificColumns,
    withFilters,
    foreignTables,
    subscribeToUpdates,
    aavePosition,
    transformExample,
    transformObjectExample,
    functionExample,
}
