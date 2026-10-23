import { useEffect, useState } from "react";
import { Box, Chip, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import type { ClarifyChoice, ClarifyQuestion } from "@terrarium/contracts";

export type StackSelection = { frontendStack: string; backendNeed: "yes"|"no"; backendStack: string };

const BE: Record<string, {value:string;label:string}[]> = {
  react:   [{value:"none",label:"Frontend only"},{value:"node-express",label:"+ Node / Express backend"}],
  angular: [{value:"none",label:"Frontend only"},{value:"node-express",label:"+ Node / Express backend"}],
  sapui5:  [{value:"none",label:"Frontend only"},{value:"sap-cap",label:"+ SAP CAP backend"}],
  custom:  [{value:"none",label:"Frontend only"}],
};
const MAROON = "var(--tt-accent-fill)";
const BORDER = "var(--tt-line-strong)";
const SEL_BG = "var(--tt-tint-selected)";
const MUTED = "text.secondary";

function getRec(choices: ClarifyChoice[]) { return choices.find(c=>c.recommended)?.value ?? choices[0]?.value ?? "react"; }
function Dot({selected}:{selected:boolean}) {
  return <Box aria-hidden sx={{width:20,height:20,borderRadius:"50%",border:"1.5px solid",borderColor:selected?"var(--tt-accent-text)":"var(--tt-line-strong)",bgcolor:selected?"var(--tt-accent-fill)":"transparent",color:selected?"#fff":"var(--tt-accent-text)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14,fontWeight:700,lineHeight:1}}>{selected?"✓":"+"}</Box>;
}

export function StackSelectorStep({step,disabled=false,onSelect}:{step:ClarifyQuestion;disabled?:boolean;onSelect:(json:string,display:string)=>void}) {
  const choices = step.choices ?? [];
  const rec = getRec(choices);
  const [fe, setFe] = useState(rec);
  const [be, setBe] = useState("none");

  function emit(f:string,b:string) {
    const json = JSON.stringify({frontendStack:f,backendNeed:b!=="none"?"yes":"no",backendStack:b});
    const fl = choices.find(c=>c.value===f)?.title ?? f;
    const bl = (BE[f]??BE.react!).find(o=>o.value===b)?.label ?? b;
    onSelect(json,`${fl} — ${bl}`);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{emit(fe,be);},[]);

  function setFrontend(v:string){setFe(v);setBe("none");emit(v,"none");}
  function setBackend(v:string){setBe(v);emit(fe,v);}

  const beOpts = BE[fe]??BE.react!;
  const isCustom = fe==="custom";
  const title = choices.find(c=>c.value===fe)?.title ?? fe;

  return (
    <Stack spacing={2.5}>
      <Stack spacing={1} role="radiogroup" aria-label={step.text}>
        {choices.map(choice=>{
          const sel = choice.value===fe;
          return (
            <Box key={choice.value} role="radio" aria-checked={sel} tabIndex={sel?0:-1}
              onClick={()=>!disabled&&setFrontend(choice.value)}
              onKeyDown={e=>{if((e.key===" "||e.key==="Enter")&&!disabled)setFrontend(choice.value);}}
              sx={{display:"flex",alignItems:"flex-start",gap:1,px:"14px",py:"10px",borderRadius:"12px",border:"1.5px solid",borderColor:sel?"var(--tt-accent-text)":BORDER,bgcolor:sel?SEL_BG:"var(--tt-surface)",cursor:disabled?"not-allowed":"pointer",outline:"none","&:focus-visible":{boxShadow:"0 0 0 3px color-mix(in srgb, var(--tt-accent-text) 26%, transparent)"}}}>
              <Dot selected={sel}/>
              <Box sx={{minWidth:0,flex:1}}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                  <Typography sx={{fontSize:14,fontWeight:700,lineHeight:1.25}}>{choice.title}</Typography>
                  {choice.recommended?<Chip label="Recommended" size="small" sx={{height:18,fontSize:11,fontWeight:600,bgcolor:MAROON,color:"#fff",borderRadius:"999px","& .MuiChip-label":{px:1}}}/>:null}
                </Stack>
                {choice.subtitle?<Typography sx={{fontSize:13,color:MUTED,mt:0.35,lineHeight:1.35}}>{choice.subtitle}</Typography>:null}
              </Box>
            </Box>
          );
        })}
      </Stack>

      {fe!=="custom"?(
        <FormControl fullWidth size="small">
          <InputLabel>Backend</InputLabel>
          <Select label="Backend" value={be} disabled={disabled} onChange={e=>setBackend(e.target.value)} sx={{borderRadius:"12px"}}>
            {beOpts.map(o=><MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
      ):null}

      {isCustom?(
        <Box sx={{p:2,borderRadius:"12px",bgcolor:"#fff8e1",border:"1.5px solid #f59e0b"}}>
          <Typography sx={{fontSize:13,fontWeight:600,color:"#92400e",mb:0.5}}>Custom stack</Typography>
          <Typography sx={{fontSize:13,color:"#78350f",lineHeight:1.5}}>
            Custom stacks are not yet supported. Terra will stop before building starts.
          </Typography>
        </Box>
      ):null}
    </Stack>
  );
}
