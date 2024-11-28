
const wk : Worker = self as any;

interface SolverCmd
{
  cmd:    string;
  layout: number;
  cells:  number[];
  manPos: number;
} // interface SolverCmd

class W
{
  static ActiveCmd:string='';

  static UpdateProgress(nstates: number)
  {
    wk.postMessage({
      type:       'Progress',
      cmd:        W.ActiveCmd,
      nstates:     nstates
    });
  } // W.UpdateProgress()

  static SendResultToHost(layout:number, nmoves:number, moves: number[])
  {
    wk.postMessage
    ({
      type:   'Solution',
      cmd:    W.ActiveCmd,
      layout: layout,
      nmoves: nmoves,
      moves:  moves
    });
  } // W.SendResultToHost()

  static wasmMemory:WebAssembly.Memory = new WebAssembly.Memory({initial:200}); // 200*65536 ~12M
  static getHeapBase: (()=>number) = null;
  static wasmMemUint8: Uint8Array = null;
  static SolverStartTime: number=0; // 0 means Solver inactive.
  static BFSSolver: ((c0:number, c1:number, c2:number, c3:number, c4:number, c5:number, c6:number, c7:number, c8:number, manPos:number)=>number) = null;

  static Init()
  {
    fetch('solver/lavenbfs.wasm')
    .then(response=>response.arrayBuffer())
    .then(bytes=>
      WebAssembly.instantiate(bytes,
      {
      env:{
        jsConsoleLog:
          (saddr:number)=>
          {
            let s='';
            for (let i=saddr; W.wasmMemUint8[i]!==0; i++) {
              s+=String.fromCharCode(W.wasmMemUint8[i]);
            }
            console.log(s);
          },

        jsProgress:
          (_nstates:number)=>
          {
            const timenow = performance.now();
            if (timenow-W.SolverStartTime>500)
            {
              wk.postMessage({type:'Progress', nstates:_nstates});
            }
          },

        memset:
          (saddr:number, val:number, len:number)=>
          {W.wasmMemUint8.fill(val, saddr, saddr+len);},

        jsPrtVaList:
          (listaddr:number)=>
          {
            let arr = new Uint32Array(W.wasmMemory.buffer, listaddr, 32);
            let nargs = Math.min(32, arr[0]&0xffff);
            let s='';
            for (let i=0; i<=nargs; i++) {
              if ((arr[i*2]&0xffff)===nargs-i) {
                let val = arr[i*2+1];
                switch (arr[i*2]>>16) {
                case 1: // string argument
                  {
                    let len=0;
                    for (let j=val; W.wasmMemUint8[j]!==0; j++, len++) {}
                    s+=(new TextDecoder()).decode(new Uint8Array(W.wasmMemory.buffer, val, len));
                  // for (let j=val; W.wasmMemUint8[j]!==0; j++) {
                  //   s+=String.fromCharCode(W.wasmMemUint8[j]);
                  }
                  break;
                case 2:
                  s+=val.toString();
                  break;
                case 4:
                  s+="0x"+val.toString(16);
                  break;
                case 3:
                  let buf = new Uint8Array([val&0xff, (val>>8)&0xff, (val>>16)&0xff, (val>>24)&0xff]);
                  let farr = new Float32Array(buf.buffer);
                  s+=farr[0].toFixed(2);
                  break;
                }
              }
              else {
                console.log('Bad VaList entry at '+i);
                break;
              }
            } // for (i)
            console.log(s);
          }, // jsPrtVaList() //

        memory: W.wasmMemory,
      }}))
    .then(result =>
    {
      let exp = result.instance.exports;
      W.getHeapBase = exp.get_heap_base as ()=>number;
      console.log("heap_base:"+W.getHeapBase()+"  buf_sz:"+W.wasmMemory.buffer.byteLength);
      let heapbase = W.getHeapBase();
      // let oldmembuf = new Uint32Array(W.wasmMemory.buffer);
      // console.log('oldbuf['+heapbase+']='+oldmembuf[heapbase/4].toString(16));
      // G.wasmMemory.grow(200);  // After this call, the old wasmMemory.buffer will be modified and oldmembuf will become invalid, as illustrated in a subsequent log() display below.
      // let newmembuf = new Uint32Array(G.wasmMemory.buffer);
      // console.log("heap_base:"+heapbase+"  buf_sz:"+G.wasmMemory.buffer.byteLength);
      // exp.InitHeap((200*65536-heapbase);
      W.wasmMemUint8 = new Uint8Array(W.wasmMemory.buffer);

      W.BFSSolver=exp.LAvenBFS as (c0:number, c1:number, c2:number, c3:number, c4:number, c5:number, c6:number, c7:number, c8:number, manPos:number)=>number;

      // const time0 = performance.now();
      // // console.log(W.BFSSolver(13,8,4,11,0,1,10,8,4, 7));
      // // Board game("xJjEE-lf?",6);  // LVL 49X
      // console.log(W.BFSSolver(0,9,1,7,7,13,2,3,12, 6));
      // const time1 = performance.now();
      // console.log("BFSSolver took "+(time1-time0)+"ms");
      wk.postMessage({type:'WasmReady'});
    })
    .catch((reason:any)=>{
      console.log(reason);
    });

    // Set up message handler for communicating with the main script
    wk.addEventListener('message', function(e: MessageEvent)
    {
      let data = e.data as SolverCmd;
      console.log("lavenworker got ["+ data.cmd + "] cmd.");
      W.ActiveCmd = data.cmd;
      switch (data.cmd) {
      case 'NavInfo':
      case 'LvlPrep':
      case 'Solve':
        if (data.cells.length===9 && data.manPos>=0 && data.manPos<9)
        {
          const c=data.cells;
          let nX=0;
          for (let i=0; i<9; i++)
          {
            if (c[i]===0) nX++;       // found a hole.
            if (c[i]<0 || c[i]>14) {  // bad cell type.
              nX=1000+i;              // just an invalid value.
              break;
            }
          } // for (i)
          if (nX===1) // Make sure that there is only one "hole". O.w. an invalid board.
          {
            W.SolverStartTime = performance.now();
            // console.log(W.BFSSolver(13,8,4,11,0,1,10,8,4, 7));
            // Board game("xJjEE-lf?",6);  // LVL 49X
            const solve=W.BFSSolver(
              c[0],c[1],c[2],c[3],c[4],c[5],c[6],c[7],c[8], data.manPos);
            let nmoves=0;
            const moves=[];
            if (solve!==0)
            {
              const time1 = performance.now();
              console.log("BFS Solver took "+(time1-W.SolverStartTime)+"ms");
              const mv = new Uint32Array(W.wasmMemory.buffer, solve);
              nmoves=mv[0];
              for (let i=0; i<nmoves*2; i++)
                moves.push(mv[i+1]);
            }
            W.SendResultToHost(data.layout, nmoves, moves);
            W.SolverStartTime=0;
          }
          else
            W.SendResultToHost(data.layout, 0, []);
        }
        break;
      } // switch (data.cmd)
      W.ActiveCmd='';
    }); // addEventListener()
  } // W.Init()

} // class W

W.Init();
