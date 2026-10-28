import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
async function downloadText(page: Page) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download", exact: true }).click();
  return readFile((await (await pending).path())!, "utf8");
}
test("qr-code-generator: decode downloaded pristine version-one byte payload", async ({ page }) => {
  await page.goto("/tools/qr-code-generator");
  await page.getByLabel("QR Code Text / URL").fill("hello world");
  await expect(page.getByAltText("QR Code")).toBeVisible();
  const pending = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download PNG", exact: true }).click();
  const png = await readFile((await (await pending).path())!);
  // Independent traversal and mask removal, for a pristine version 1 symbol.
  // Does not certify error correction, damaged symbols or every QR version.
  const decoded = await page.evaluate(async (base64) => {
    const image = new Image(); image.src = `data:image/png;base64,${base64}`; await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext("2d")!; ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const dark = (r: number,c: number) => pixels[(Math.floor((r+2.5)*12)*300+Math.floor((c+2.5)*12))*4]<128;
    const reserved = (r: number,c: number) => r===6||c===6||(r<=8&&c<=8)||(r<=8&&c>=13)||(r>=13&&c<=8);
    const masks = [(r: number,c: number)=>(r+c)%2===0,(r: number)=>r%2===0,(_r: number,c: number)=>c%3===0,(r: number,c: number)=>(r+c)%3===0,(r: number,c: number)=>(Math.floor(r/2)+Math.floor(c/3))%2===0,(r: number,c: number)=>(r*c)%2+(r*c)%3===0,(r: number,c: number)=>((r*c)%2+(r*c)%3)%2===0,(r: number,c: number)=>((r+c)%2+(r*c)%3)%2===0];
    const candidates: string[]=[];
    for(const mask of masks){
      const bits: number[]=[]; let upward=true;
      for(let right=20;right>=1;right-=2){
        if(right===6)right--;
        for(let i=0;i<21;i++){const r=upward?20-i:i;for(const c of [right,right-1])if(!reserved(r,c))bits.push(Number(dark(r,c)!==mask(r,c)));}
        upward=!upward;
      }
      const number=(start: number,count: number)=>bits.slice(start,start+count).reduce((n,b)=>n*2+b,0);
      const count=number(4,8);
      if(number(0,4)===4&&count>0&&count<=14)candidates.push(new TextDecoder().decode(Uint8Array.from({length:count},(_,i)=>number(12+i*8,8))));
    }
    return candidates;
  },png.toString("base64"));
  expect(decoded.filter(value=>value==="hello world")).toHaveLength(1);
});
test("barcode-generator: downloaded Code 128 bars decode payload and checksum",async({page})=>{
  await page.goto("/tools/barcode-generator"); await page.getByLabel("Barcode Data").fill("ABC123");
  const pending=page.waitForEvent("download"); await page.getByRole("link",{name:"Download SVG",exact:true}).click();
  const svg=await readFile((await(await pending).path())!,"utf8");
  const runs=await page.evaluate(source=>{
    const doc=new DOMParser().parseFromString(source,"image/svg+xml");
    const bars=Array.from(doc.querySelectorAll("path[stroke-width]")).flatMap(path=>{
      const width=Number(path.getAttribute("stroke-width"));
      return [...path.getAttribute("d")!.matchAll(/M([\d.]+) [\d.]+L[\d.]+ [\d.]+/g)].map(m=>({left:Number(m[1])-width/2,width}));
    }).sort((a,b)=>a.left-b.left);
    const unit=Math.min(...bars.map(bar=>bar.width));
    return bars.flatMap((bar,i)=>i+1<bars.length?[bar.width/unit,(bars[i+1].left-bar.left-bar.width)/unit]:[bar.width/unit]);
  },svg);
  const patterns: Record<string,number>={"211214":104,"111323":33,"131123":34,"131321":35,"123221":17,"223211":18,"221132":19,"141122":67};
  const codes=Array.from({length:8},(_,i)=>patterns[runs.slice(i*6,i*6+6).join("")]);
  expect(codes).toEqual([104,33,34,35,17,18,19,67]); expect(runs.slice(48).join("")).toBe("2331112");
  expect((codes[0]+codes.slice(1,-1).reduce((sum,code,i)=>sum+code*(i+1),0))%103).toBe(codes.at(-1));
  expect(String.fromCharCode(...codes.slice(1,-1).map(code=>code+32))).toBe("ABC123");
});
test("sitemap-generator: downloaded XML round-trips escaped values and deduplicates",async({page})=>{
  await page.goto("/tools/sitemap-generator"); const urls=["https://example.org/search?q=blue&lang=ur","https://example.org/%D8%A7"];
  await page.getByLabel("Page URLs (one per line)").fill([...urls,urls[0]].join("\n")); await page.getByRole("button",{name:"Generate",exact:true}).click();
  await expect(page.getByTestId("seo-output")).toBeVisible(); const xml=await downloadText(page);
  expect(await page.evaluate(source=>{const doc=new DOMParser().parseFromString(source,"application/xml");return {error:!!doc.querySelector("parsererror"),namespace:doc.documentElement.namespaceURI,urls:Array.from(doc.getElementsByTagName("loc"),node=>node.textContent)};},xml)).toEqual({error:false,namespace:"http://www.sitemaps.org/schemas/sitemap/0.9",urls});
  await page.getByLabel("Page URLs (one per line)").fill("https://other.org/"); await expect(page.getByTestId("seo-output")).toHaveCount(0);
});
test("meta-tag-generator: downloaded HTML restores original Unicode and quotes",async({page})=>{
  await page.goto("/tools/meta-tag-generator"); const title='اردو <Example> & "quoted"'; const description="It's <safe> & readable 🙂";
  await page.getByLabel("Page title",{exact:true}).fill(title); await page.getByLabel("Description",{exact:true}).fill(description);
  await page.getByRole("button",{name:"Generate",exact:true}).click(); await expect(page.getByTestId("seo-output")).toBeVisible(); const html=await downloadText(page);
  expect(await page.evaluate(source=>{const doc=new DOMParser().parseFromString(source,"text/html");return {title:doc.title,description:doc.querySelector('meta[name="description"]')?.getAttribute("content"),scripts:doc.scripts.length};},html)).toEqual({title,description,scripts:0});
});
test("xml-formatter: namespace mixed text CDATA and entities preserve semantics",async({page})=>{
  await page.goto("/tools/xml-formatter"); const source='<root xmlns:x="urn:test"><x:p note="a &amp; b"> before <b>bold</b> after <![CDATA[<raw>]]></x:p></root>';
  await page.getByLabel("Source text").fill(source); await page.getByRole("button",{name:"Process",exact:true}).click(); await expect(page.getByTestId("developer-result")).not.toBeEmpty();
  const result=await page.getByTestId("developer-result").innerText();
  expect(await page.evaluate(text=>{const doc=new DOMParser().parseFromString(text,"application/xml");const p=doc.getElementsByTagNameNS("urn:test","p")[0];return {error:!!doc.querySelector("parsererror"),text:p.textContent,note:p.getAttribute("note"),bold:p.querySelector("b")?.textContent};},result)).toEqual({error:false,text:" before bold after <raw>",note:"a & b",bold:"bold"});
});
test("javascript-minifier: trusted fixture preserves template regex and numeric semantics",async({page})=>{
  await page.goto("/tools/javascript-minifier"); const source='/* remove */ function result() { const word = "اردو"; return [ `${word}: ${[1,2,3].map(n => n * n).join(",")}`, /a\\/b/.test("a/b"), 1 / 2 ]; }';
  await page.getByLabel("Source text").fill(source); await page.getByRole("button",{name:"Process",exact:true}).click(); await expect(page.getByTestId("developer-result")).not.toBeEmpty();
  const output=await page.getByTestId("developer-result").innerText();
  // Evaluates this fixed test fixture only, never untrusted user source.
  expect(await page.evaluate(code=>Function(`${code}; return result();`)(),output)).toEqual(["اردو: 1,4,9",true,0.5]);
});
test("jwt-decoder: Unicode nested claims retain original values",async({page})=>{
  await page.goto("/tools/jwt-decoder"); const claims={sub:"اردو🙂",roles:["reader"],verified:false,exp:0};
  await page.getByLabel("JWT Token Input").fill(`${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.`);
  await expect(page.locator("pre").nth(1)).toContainText("اردو🙂"); expect(JSON.parse(await page.locator("pre").nth(1).innerText())).toEqual(claims);
});
for(const id of ["hash-generator","md5-generator","sha256-generator"])test(`${id}: UTF8 digest agrees with independent Node crypto`,async({page})=>{
  await page.goto(`/tools/${id}`); const text="اردو🙂\nzero end";
  await page.getByLabel("Text Input").fill(text); await page.getByRole("button",{name:"Compute Hashes"}).click();
  await expect(page.locator("pre").nth(0)).toHaveText(createHash("md5").update(text,"utf8").digest("hex"));
  await expect(page.locator("pre").nth(1)).toHaveText(createHash("sha256").update(text,"utf8").digest("hex"));
});
test("mortgage-calculator: independent amortization recurrence pays principal",async({page})=>{
  await page.goto("/tools/mortgage-calculator"); await page.getByLabel("Loan principal").fill("123456.78"); await page.getByLabel("Annual interest percent").fill("7.25"); await page.getByLabel("Loan term years").fill("17");
  const payment=Number((await page.getByTestId("Monthly payment").innerText()).replaceAll(",",""));
  let balance=123456.78;for(let month=0;month<204;month++)balance=balance*(1+0.0725/12)-payment;
  expect(Math.abs(balance)).toBeLessThan(3); await page.getByLabel("Loan principal").fill(""); await expect(page.getByTestId("Monthly payment")).toHaveCount(0);
});
test("css-minifier: browser computed declarations preserve calc and custom properties",async({page})=>{
  await page.goto("/tools/css-minifier"); const source='.oracle { --gap: 3px; width: calc(20px + var(--gap)); color: rgb(12, 34, 56); padding: 2px 4px; }';
  await page.getByLabel("Source text").fill(source); await page.getByRole("button",{name:"Process",exact:true}).click(); await expect(page.getByTestId("developer-result")).not.toBeEmpty();
  const output=await page.getByTestId("developer-result").innerText();
  expect(await page.evaluate(css=>{const style=document.createElement("style");style.textContent=css;const node=document.createElement("div");node.className="oracle";document.head.append(style);document.body.append(node);const computed=getComputedStyle(node);const actual={width:computed.width,color:computed.color,padding:computed.padding};node.remove();style.remove();return actual;},output)).toEqual({width:"23px",color:"rgb(12, 34, 56)",padding:"2px 4px"});
});
test("html-minifier: whitespace-sensitive text and embedded script content survive",async({page})=>{
  await page.goto("/tools/html-minifier"); const source='<pre>  a\n b  </pre><!-- remove --><script type="application/json">{"text":" a  b "}</script>';
  await page.getByLabel("Source text").fill(source); await page.getByRole("button",{name:"Process",exact:true}).click();await expect(page.getByTestId("developer-result")).not.toBeEmpty();
  const output=await page.getByTestId("developer-result").innerText();
  expect(await page.evaluate(html=>{const doc=new DOMParser().parseFromString(html,"text/html");return {pre:doc.querySelector("pre")?.textContent,json:JSON.parse(doc.querySelector("script")!.textContent!)};},output)).toEqual({pre:"  a\n b  ",json:{text:" a  b "}}); expect(output).not.toContain("<!-- remove -->");
});
test("data-storage-converter: bit/byte binary/decimal conversions use physical unit identities",async({page})=>{
  await page.goto("/tools/data-storage-converter");
  await page.getByLabel("From unit").selectOption("GiB");await page.getByLabel("To unit").selectOption("Bits");await page.getByLabel("Value",{exact:true}).fill("2.5");
  await expect(page.getByTestId("Converted value")).toHaveText("21474836480 Bits");
  await page.getByLabel("From unit").selectOption("Bits");await page.getByLabel("To unit").selectOption("GB");await page.getByLabel("Value",{exact:true}).fill("21474836480");
  await expect(page.getByTestId("Converted value")).toHaveText("2.68435456 GB");
});
test("time-zone-converter: autumn repeated hour distinguishes two real instants",async({page})=>{
  await page.goto("/tools/time-zone-converter");const input=page.getByLabel("UTC instant (ISO 8601)");
  await input.fill("2026-11-01T05:30:00Z");await expect(page.getByTestId("Local time")).toContainText("01:30:00 GMT-04:00");
  await input.fill("2026-11-01T06:30:00Z");await expect(page.getByTestId("Local time")).toContainText("01:30:00 GMT-05:00");
  await page.getByLabel("Destination time zone").selectOption("Asia/Karachi");await expect(page.getByTestId("Local time")).toContainText("11:30:00 GMT+05:00");
});
test("profit-calculator: loss and zero denominators never invent percentages",async({page})=>{
  await page.goto("/tools/profit-calculator");await page.getByLabel("Revenue",{exact:true}).fill("80");await page.getByLabel("Total costs").fill("100");
  await expect(page.getByTestId("Net profit")).toHaveText("-20.00");await expect(page.getByTestId("Profit margin percent")).toHaveText("-25.00");await expect(page.getByTestId("Markup percent")).toHaveText("-20.00");
  await page.getByLabel("Revenue",{exact:true}).fill("0");await expect(page.getByTestId("Profit margin percent")).toHaveCount(0);await expect(page.getByTestId("Net profit")).toHaveText("-100.00");
  await page.getByLabel("Total costs").fill("0");await expect(page.getByTestId("Markup percent")).toHaveCount(0);await expect(page.getByTestId("Net profit")).toHaveText("0.00");
});
