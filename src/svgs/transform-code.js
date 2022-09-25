const tfCode = `<svg width="619px" height="501px" viewBox="0 0 619 501">
<g id="Exports" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" font-family="SFMono-Regular, SF Mono" font-size="12" font-weight="normal" line-spacing="20">
    <g id="Group-16">
        <text id="import-{-ListingAdde">
            <tspan x="40" y="11" fill="#6874FF">import</tspan>
            <tspan x="84.5078125" y="11" fill="#FFFFFF"> { ListingAdded } </tspan>
            <tspan x="218.03125" y="11" fill="#6874FF">from</tspan>
            <tspan x="247.703125" y="11" fill="#FFFFFF"> </tspan>
            <tspan x="255.121094" y="11" fill="#5ACCF8">'@spec.contracts/thirdweb/events'</tspan>
            <tspan x="499.914062" y="11" fill="#FFFFFF"></tspan>
            <tspan x="40" y="31" fill="#6874FF">import</tspan>
            <tspan x="84.5078125" y="31" fill="#FFFFFF"> { ListingChanged, Listing } </tspan>
            <tspan x="299.628906" y="31" fill="#6874FF">from</tspan>
            <tspan x="329.300781" y="31" fill="#FFFFFF"> </tspan>
            <tspan x="336.71875" y="31" fill="#5ACCF8">'../types'</tspan>
            <tspan x="410.898438" y="31" fill="#FFFFFF"></tspan>
            <tspan x="40" y="51" fill="#6874FF">import</tspan>
            <tspan x="84.5078125" y="51" fill="#FFFFFF"> { eventNames, listingTypes, tokenTypes, unixTsToDate } </tspan>
            <tspan x="499.914062" y="51" fill="#6874FF">from</tspan>
            <tspan x="529.585938" y="51" fill="#FFFFFF"> </tspan>
            <tspan x="537.003906" y="51" fill="#5ACCF8">'../shared'</tspan>
            <tspan x="618.601562" y="51" fill="#FFFFFF"></tspan>
            <tspan x="40" y="71" fill="#FFFFFF"></tspan>
            <tspan x="40" y="91" fill="#6874FF">async function</tspan>
            <tspan x="143.851562" y="91" fill="#FFFFFF"> </tspan>
            <tspan x="151.269531" y="91" fill="#97C8FF">transform</tspan>
            <tspan x="218.03125" y="91" fill="#FFFFFF">(event: </tspan>
            <tspan x="277.375" y="91" fill="#39DAD6">ListingAdded</tspan>
            <tspan x="366.390625" y="91" fill="#FFFFFF">): </tspan>
            <tspan x="388.644531" y="91" fill="#39DAD6">Promise</tspan>
            <tspan x="440.570312" y="91" fill="#FFFFFF">&lt;</tspan>
            <tspan x="447.988281" y="91" fill="#39DAD6">ListingChanged</tspan>
            <tspan x="551.839844" y="91" fill="#FFFFFF">&gt; {</tspan>
            <tspan x="40" y="111" fill="#FFFFFF">    </tspan>
            <tspan x="69.671875" y="111" fill="#6874FF">const</tspan>
            <tspan x="106.761719" y="111" fill="#FFFFFF"> rawListing = event.data.listing</tspan>
            <tspan x="40" y="131" fill="#FFFFFF">    </tspan>
            <tspan x="69.671875" y="131" fill="#6874FF">const</tspan>
            <tspan x="106.761719" y="131" fill="#FFFFFF"> listing: </tspan>
            <tspan x="180.941406" y="131" fill="#39DAD6">Listing</tspan>
            <tspan x="232.867188" y="131" fill="#FFFFFF"> = {</tspan>
            <tspan x="40" y="151" fill="#FFFFFF">        ...rawListing,</tspan>
            <tspan x="40" y="171" fill="#FFFFFF">        contractAddress: event.source.address,</tspan>
            <tspan x="40" y="191" fill="#FFFFFF">        listingType: rawListing.listingType ? </tspan>
            <tspan x="381.226562" y="191" fill="#5ACCF8">'auction'</tspan>
            <tspan x="447.988281" y="191" fill="#FFFFFF"> : </tspan>
            <tspan x="470.242188" y="191" fill="#5ACCF8">'direct'</tspan>
            <tspan x="529.585938" y="191" fill="#FFFFFF">,</tspan>
            <tspan x="40" y="211" fill="#FFFFFF">        tokenType: rawListing.tokenType ? </tspan>
            <tspan x="351.554688" y="211" fill="#5ACCF8">'erc721'</tspan>
            <tspan x="410.898438" y="211" fill="#FFFFFF"> : </tspan>
            <tspan x="433.152344" y="211" fill="#5ACCF8">'erc721'</tspan>
            <tspan x="492.496094" y="211" fill="#FFFFFF">,</tspan>
            <tspan x="40" y="231" fill="#FFFFFF">        startTime: </tspan>
            <tspan x="180.941406" y="231" fill="#97C8FF">unixTsToDate</tspan>
            <tspan x="269.957031" y="231" fill="#FFFFFF">(rawListing.startTime),</tspan>
            <tspan x="40" y="251" fill="#FFFFFF">        endTime: </tspan>
            <tspan x="166.105469" y="251" fill="#97C8FF">unixTsToDate</tspan>
            <tspan x="255.121094" y="251" fill="#FFFFFF">(rawListing.endTime),</tspan>
            <tspan x="40" y="271" fill="#FFFFFF">        isCanceled: </tspan>
            <tspan x="188.359375" y="271" fill="#6874FF">false</tspan>
            <tspan x="225.449219" y="271" fill="#FFFFFF">,            </tspan>
            <tspan x="40" y="291" fill="#FFFFFF">    }</tspan>
            <tspan x="40" y="311" fill="#FFFFFF">    </tspan>
            <tspan x="69.671875" y="311" fill="#6874FF">return</tspan>
            <tspan x="114.179688" y="311" fill="#FFFFFF"> {</tspan>
            <tspan x="40" y="331" fill="#FFFFFF">        ...event,</tspan>
            <tspan x="40" y="351" fill="#FFFFFF">        name: </tspan>
            <tspan x="143.851562" y="351" fill="#5ACCF8">'ListingChanged'</tspan>
            <tspan x="262.539062" y="351" fill="#FFFFFF">,</tspan>
            <tspan x="40" y="371" fill="#FFFFFF">        data: listing,</tspan>
            <tspan x="40" y="391" fill="#FFFFFF">    }</tspan>
            <tspan x="40" y="411" fill="#FFFFFF">}</tspan>
            <tspan x="40" y="431" fill="#FFFFFF"></tspan>
            <tspan x="40" y="451" fill="#6874FF">export default</tspan>
            <tspan x="143.851562" y="451" fill="#FFFFFF"> </tspan>
            <tspan x="151.269531" y="451" fill="#97C8FF">transform</tspan>
        </text>
        <text id="1-2-3-4-5-6-7-8-9-10" fill="#727A92" fill-opacity="0.505381337">
            <tspan x="7.58203125" y="12">1</tspan>
            <tspan x="7.58203125" y="32">2</tspan>
            <tspan x="7.58203125" y="52">3</tspan>
            <tspan x="7.58203125" y="72">4</tspan>
            <tspan x="7.58203125" y="92">5</tspan>
            <tspan x="7.58203125" y="112">6</tspan>
            <tspan x="7.58203125" y="132">7</tspan>
            <tspan x="7.58203125" y="152">8</tspan>
            <tspan x="7.58203125" y="172">9</tspan>
            <tspan x="0.1640625" y="192">10</tspan>
            <tspan x="0.1640625" y="212">11</tspan>
            <tspan x="0.1640625" y="232">12</tspan>
            <tspan x="0.1640625" y="252">13</tspan>
            <tspan x="0.1640625" y="272">14</tspan>
            <tspan x="0.1640625" y="292">15</tspan>
            <tspan x="0.1640625" y="312">16</tspan>
            <tspan x="0.1640625" y="332">17</tspan>
            <tspan x="0.1640625" y="352">18</tspan>
            <tspan x="0.1640625" y="372">19</tspan>
            <tspan x="0.1640625" y="392">20</tspan>
            <tspan x="0.1640625" y="412">21</tspan>
            <tspan x="0.1640625" y="432">22</tspan>
            <tspan x="0.1640625" y="452">23</tspan>
            <tspan x="15" y="472"></tspan>
        </text>
    </g>
</g>
</svg>`

export default tfCode