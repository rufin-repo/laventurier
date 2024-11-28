///<reference types="@types/webassembly-web-api"/>

  const K={
    kRoomImgsReady:   1,
    kBoardImgsReady:  2,
    kAllImgsReady:    3,// Union of the above flags.

    kRoomOffsetX:193,   // x offset, in pixels, from the left side of the board image.
    kRoomOffsetY:165,   // y offset, in pixels, from the top side of the board image.
    kRoomWidth:Math.floor(1347/3),  // in pixels
    kRoomHeight:Math.floor(1338/3), // in pixels
    ManImgOffCenterX: 80,
    ManImgOffCenterY: 105,
    kManExitSpace:0.12, // as a fraction of the board image width
    AnimTimerStep:10,   // in msec
    MoveDuration:220,   // in msec
    NavSolveDelay:300,  // in msec (delay before calling G.SolveForNav())
    ResizeDebounceDelay:200, // in msec
    MinDragLength:15,   // in px
    BadManMoveFrac:2,   // 1/ this value.
    ExitAnimFracLimit: 1.2,
    DragStepDiff: 8,


    HTTPTimeout:   15000,

    CSS_SelectedLvl: "lvlSelected",
    CK_LastLevel: 'LAvenLvl',
    CK_UsrMinMove: 'NMX_',  // N-move exit prefix.

    // NavOnTxt: "\ue87a",
    // NavOffTxt: "\ue9a8",
    // NavOnTxt: "\ue1d8",
    // NavOffTxt: "\ue1da",
    NavOnTxt: "\ue63e",
    NavOffTxt: "\ue648",
    SoundOnTxt: "\ue050",
    SoundOffTxt:"\ue04f",

    HTM_DiffRate:[
      // '&#x263a;',
      // '&#x263a;',
      // '&#x263b;',
      // '&#x26a0;',
      // '&#x26a0;&#x26a0;',
      // '&#x2623;',
      // '&#x2623;&#x2623;',
      // '&#x2623;&#x2623;&#x2623;',
      // '&#x2620;',
      // '&#x2620;&#x2620;',
      // '&#x2620;&#x2620;&#x2620;',
      // '&#x2620;&#x2620;&#x2620;&#x2620;',
      // '&#x2620;&#x2620;&#x2620;&#x2620;',
      '&#xe83a;&#xe83a;&#xe83a;&#xe83a;&#xe83a;', // 0   stars
      '&#xe839;&#xe83a;&#xe83a;&#xe83a;&#xe83a;', // 1/2 star
      '&#xe838;&#xe83a;&#xe83a;&#xe83a;&#xe83a;', // 1   star
      '&#xe838;&#xe839;&#xe83a;&#xe83a;&#xe83a;', // 1.5 stars
      '&#xe838;&#xe838;&#xe83a;&#xe83a;&#xe83a;', // 2   stars
      '&#xe838;&#xe838;&#xe839;&#xe83a;&#xe83a;', // 2.5 stars
      '&#xe838;&#xe838;&#xe838;&#xe83a;&#xe83a;', // 3   stars
      '&#xe838;&#xe838;&#xe838;&#xe839;&#xe83a;', // 3.5 stars
      '&#xe838;&#xe838;&#xe838;&#xe838;&#xe83a;', // 4   stars
      '&#xe838;&#xe838;&#xe838;&#xe838;&#xe839;', // 4.5 stars
      '&#xe838;&#xe838;&#xe838;&#xe838;&#xe838;', // 5   stars
      '&#xe838;&#xe838;&#xe838;&#xe838;&#xe838;', // 5   stars
      '&#xe838;&#xe838;&#xe838;&#xe838;&#xe838;', // ..
      '&#xe838;&#xe838;&#xe838;&#xe838;&#xe838;', // ..
      '&#xe838;&#xe838;&#xe838;&#xe838;&#xe838;',
      '&#xe838;&#xe838;&#xe838;&#xe838;&#xe838;',
      '&#xe838;&#xe838;&#xe838;&#xe838;&#xe838;',
    ],
  };

  //
  //  WorkerMsg: message from worker thread.
  //
  interface WorkerMsg
  {
    'type': string;
    'cmd':  string;   // request type that led to this WorkerMsg.
    'layout':number;
    'nmoves':number;
    'moves': number[];
    'nstates': number;
  };


  //-----------------------------------------------------------------------
  //  Some general web-app utility functions
  //-----------------------------------------------------------------------
  function byId(id:string) : HTMLElement { return document.getElementById(id) as HTMLElement; }
  function HasClassQ(ele:HTMLElement, cls:string) : boolean {
    return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'))!==null;
  }
  function AddClass(ele:HTMLElement, cls:string) {
    if (!HasClassQ(ele,cls)) {
      ele.className = (ele.className+" "+cls).trim();
    }
  }
  function RemoveClass(ele:HTMLElement, cls:string) {
    if (HasClassQ(ele,cls))
      ele.className=ele.className.replace(
        new RegExp('(\\s|^)'+cls+'(\\s|$)'),' ').trim();
  }
  function SetCookie(cname:string, cvalue:string)
  {
    try {
      if (cvalue===null)
        window.localStorage.removeItem(cname);
      else
        window.localStorage.setItem(cname, cvalue);
    }
    catch (err) { }
  } // SetCookie() //

  function GetCookie(cname:string)
  {
    let cvalue='';
    try {
      cvalue = window.localStorage.getItem(cname);
      if (cvalue === null) cvalue='';
    }
    catch (err) { }
    return cvalue;
  } // GetCookie() //


  //*********************************************
  //     ______                     __
  //    / ____/___  ____  _________/ /
  //   / /   / __ \/ __ \/ ___/ __  /
  //  / /___/ /_/ / /_/ / /  / /_/ /
  //  \____/\____/\____/_/   \__,_/
  //
  //*********************************************
  class Coord
  {
    x:number;
    y:number;
    public Set(xx:number, yy:number) {this.x=xx; this.y=yy;};
    constructor(xx:number|Coord, yy:number|Delta|null=null)
    {
      this.x=-1;
      this.y=-1;
      if (xx instanceof Coord) {
        if (yy instanceof Delta)
          this.Set(xx.x+yy.dx, xx.y+yy.dy);
        else if (typeof(yy)==='number')   // assume yy is a direction [0..3]
        {
          this.Set(xx.x+Delta.sDx[yy], xx.y+Delta.sDy[yy]);
        }
      }
      else if (typeof(xx)==='number' && typeof(yy)==='number') {
        this.Set(xx,yy);
      }
      // else {
      //   this.Set(-1,-1);
      //   throw "Invalid Coord construction.";
      // }
    } // constructor()
    Shift(shf:Delta) {this.x+=shf.dx; this.y+=shf.dy;}
    eq(c:Coord) {return c.x===this.x && c.y===this.y;}
    dirFrom(c:Coord) : number // -ve if not adjacent
    {
      if (c.x===this.x && Math.abs(c.y-this.y)===1)
      {
        return this.y-c.y===1 ? 2 : 0;
      }
      else if (c.y===this.y && Math.abs(c.x-this.x)===1)
      {
        return this.x-c.x===1 ? 1 : 3;
      }
      else
        return -1;
    }
  } // class Coord

  //************************************************
  //      ____       ____
  //     / __ \___  / / /_____ _
  //    / / / / _ \/ / __/ __ `/
  //   / /_/ /  __/ / /_/ /_/ /
  //  /_____/\___/_/\__/\__,_/
  //
  //************************************************
  class Delta
  {
    public static sDx=[0,1,0,-1];
    public static sDy=[-1,0,1,0];
    dx:number;
    dy:number;
    constructor(dir:number=-1)
    {
      if (dir<0 || dir>3){ this.dx=0; this.dy=0;}
      else { this.dx=Delta.sDx[dir]; this.dy=Delta.sDy[dir];}
    } // constructor()
  } // class Delta


  //*********************************************
  //     ______     ____
  //    / ____/__  / / /
  //   / /   / _ \/ / /
  //  / /___/  __/ / /
  //  \____/\___/_/_/
  //
  //*********************************************
  class Cell
  {
    public static sCellSymbolSetRegEx="[x┘└┌┐↑↓←→╝╚╔╗═║]";
    public static IsVacantSymQ(x:string) {return x==='x';}
    private static sSymbols =
      ['x', '┘', '└', '┌', '┐', '↓', '↑', '→', '←', '╝', '╚', '╔', '╗', '═', '║'];
    //  0    1    2    3    4    5    6    7    8    9    10   11   12   13   14

    // sLvl tabulates the room connector types towards each direction from each particular room tile.
    // sLvl[rType][dir] would give the connector of a room type of type 'rType' towards 'dir'.
    // sLvl[rType][dir]===0 means impassible towards dir (i.e. a wall).
    // The 5th element is the floor level of a particular room tile type.
    private static sLvl: number[][] = [
      [0,0,0,0, 0],  // 'x'  A vacant cell (a dummy record)
      [1,0,0,1, 1],  // '┘'
      [1,1,0,0, 1],  // '└'
      [0,1,1,0, 1],  // '┌'
      [0,0,1,1, 1],  // '┐'
      [1,0,2,0, 1],  // '↓'
      [2,0,1,0, 1],  // '↑'
      [0,2,0,1, 1],  // '→'
      [0,1,0,2, 1],  // '←'
      [2,0,0,2, 2],  // '╝'
      [2,2,0,0, 2],  // '╚'
      [0,2,2,0, 2],  // '╔'
      [0,0,2,2, 2],  // '╗'
      [0,2,0,2, 2],  // '═'
      [2,0,2,0, 2],  // '║'
    ];
    private static RoomImgs:HTMLImageElement[][]=null;
    private static SclRoomCanvs:HTMLCanvasElement[][]=[[null,null]];
    private static SclRoomCanvScls:number[]=[];
    private static SclManCanv:HTMLCanvasElement=null;
    private static SclManCanvScl=-1;

    private static ManImg:HTMLImageElement=null;
    private static NRoomImgsLoaded=0;
    private static UpdateImgsLoadedCount()
    {
      Cell.NRoomImgsLoaded++;
      console.log("loaded cell img "+Cell.NRoomImgsLoaded+" loaded.");
      if (Cell.NRoomImgsLoaded===29) //Cell.sSymbols.length)  // 14x2 rooms + 1 man
        G.ImagesReady(K.kRoomImgsReady);
    } // Cell.UpdateImgsLoadedCount()

    public static LoadImages()
    {
      Cell.RoomImgs=[[null,null]];
      for (let i=0; i<Cell.sSymbols.length; i++)
      {
        Cell.RoomImgs[i]   =[null,null];
        Cell.SclRoomCanvs[i]=[null,null];
        if (i>0)
        {
          Cell.RoomImgs[i][0]=new Image();
          Cell.RoomImgs[i][0].onload=Cell.UpdateImgsLoadedCount;
          Cell.RoomImgs[i][0].src="rsrc/Room"+i+"Bot.webp";

          Cell.RoomImgs[i][1]=new Image();
          Cell.RoomImgs[i][1].onload=Cell.UpdateImgsLoadedCount;
          Cell.RoomImgs[i][1].src="rsrc/Room"+i+"Top.webp";

          Cell.SclRoomCanvScls[i]=-1; // invalidate
          Cell.SclRoomCanvs[i][0]=null;
          Cell.SclRoomCanvs[i][1]=null;
        } // if (i>0)
      } // for (i)
      Cell.ManImg=new Image();
      Cell.ManImg.onload=Cell.UpdateImgsLoadedCount;
      Cell.ManImg.src="rsrc/Pawn.webp";
    } // Cell.LoadImages()

    public mType: number;

    public static SymToType(sym:string) {return Cell.sSymbols.indexOf(sym);}

    public static LayoutFrom4bitCells(cells:number, xPos:number) : string
    {
      let layout='';
      xPos=Math.min(8, Math.max(0, xPos));
      for (let i=0; i<8; i++)
      {
        if (i===xPos) layout+=Cell.sSymbols[0];
        layout+=Cell.sSymbols[cells&0xf];
        cells>>=4;
      } // for i
      return layout;
    } // LayoutFrom4bitCells()

    constructor(symbol:string)
    {
      this.mType=Cell.SymToType(symbol);
      // default to vacant.
      if (this.mType<0) this.mType=0;
    } // constructor()

    public Connector(dir:number) { return Cell.sLvl[this.mType][dir]; }
    get level()   { return Cell.sLvl[this.mType][4]; }
    get noRoomQ() { return this.mType===0;}
    get type()    { return this.mType;}
    public CanGoIntoQ(to:Cell, dir:number) : boolean
    {
      const connector=this.Connector(dir);
      return to && !to.noRoomQ && connector && connector===to.Connector((dir+2)%4);
    } // CanGoIntoQ(to:Cell, dir:number)

    private getScaledRoomCanv(layer:number, scl:number) : HTMLCanvasElement
    {
      if (this.mType>0 && this.mType<=Cell.sSymbols.length)
      {
        const l = layer===0 ? 0 : 1;

        if (Cell.SclRoomCanvScls[this.mType]!==scl)
        {
          for (let ll=0; ll<2; ll++)
          {
            const oimg = Cell.RoomImgs[this.mType][ll];
            const canv = Cell.SclRoomCanvs[this.mType][ll] = document.createElement('canvas');
            canv.width = Math.floor(scl*oimg.width);
            canv.height= Math.floor(scl*oimg.height);
            const ctx = canv.getContext('2d');
            ctx.drawImage(oimg, 0,0,oimg.width,oimg.height, 0,0,canv.width, canv.height);
          }
          Cell.SclRoomCanvScls[this.mType]=scl;
        }
        return Cell.SclRoomCanvs[this.mType][l];
      }
      else
        return null;
    } // Cell::getScaledRoomCanv()

    private static getScaledManCanv(scl:number) : HTMLCanvasElement
    {
      if (Cell.SclManCanvScl!==scl)
      {
        const img = Cell.ManImg;
        const canv = Cell.SclManCanv = document.createElement('canvas');
        canv.width = Math.floor(scl*img.width);
        canv.height= Math.floor(scl*img.height);
        const ctx = canv.getContext('2d');
        ctx.drawImage(img, 0,0,img.width,img.height, 0,0,canv.width, canv.height);
        Cell.SclManCanvScl=scl;
      }
      return Cell.SclManCanv;
    } // Cell::getScaledManCanv()

    public Draw(
      ctx:CanvasRenderingContext2D,
      rX:number, rY:number, cellCoord:Coord,
      scl:number, layer:number,
      activeMove:Movement, animFrac:number,
      drawManQ:boolean)
    {
      const kRoomWidth=K.kRoomWidth;
      const kRoomHeight=K.kRoomHeight;
      const kRoomLOff=4;  // pixel offset of room images.
      const kRoomTOff=4;
      const kManLOff=155; // pixel offset to the base center of the man pawn.
      const kManTOff=130;
      const canv=this.getScaledRoomCanv(layer, scl);
      // ctx.fillStyle="rgba(0,0,0,3)";
      if (canv && canv.width>1 && canv.height>1)
      {
        let cX=cellCoord.x;
        let cY=cellCoord.y;
        if (activeMove)
        {
          const shf = activeMove.CellShift(cellCoord);
          if (shf)
          {
            cX+=shf.dx*animFrac;
            cY+=shf.dy*animFrac;
          }
        }
        if (!drawManQ)
          ctx.drawImage(canv,
            rX+(kRoomWidth*cX+kRoomLOff)*scl,
            rY+(kRoomHeight*cY+kRoomTOff)*scl);
        else
        {
          const img = Cell.getScaledManCanv(scl);
        // if (drawManQ && Cell.ManImg && Cell.ManImg.width>1 && Cell.ManImg.height>1)
        // {
        //   const img = Cell.ManImg;
          let mX=cellCoord.x;
          let mY=cellCoord.y;
          if (activeMove)
          {
            const shf =activeMove.ManShift();
            if (shf)
            {
              mX+=shf.dx*animFrac;
              mY+=shf.dy*animFrac;
            }
          }
          ctx.drawImage(img,
            rX+(kRoomWidth*mX+kManLOff)*scl,
            rY+(kRoomHeight*mY+kManTOff)*scl);
            // img.width*scl, img.height*scl);
        }
      } // if (img ...
    } // Cell::Draw()
  } // class Cell


  //**********************************************************
  //  class Movement: a one step change to the Board
  //      __  ___                                     __
  //     /  |/  /___ _   _____  ____ ___  ___  ____  / /_
  //    / /|_/ / __ \ | / / _ \/ __ `__ \/ _ \/ __ \/ __/
  //   / /  / / /_/ / |/ /  __/ / / / / /  __/ / / / /_
  //  /_/  /_/\____/|___/\___/_/ /_/ /_/\___/_/ /_/\__/
  //
  //**********************************************************
  class Movement
  {
    private mDir:number;
    private mShift:Delta;    // horz/vert +-1 (while this can be derived from mDir, store this for efficiency)
    private mAffected:Coord[]; // which cell(s) is/are being shifted. (null if moving the Man)
    UndoingQ:boolean;

    public get yMoveQ():boolean {return (this.mDir&1)===0;}
    public get manMoveQ():boolean {return this.mAffected===null;}
    public get positiveQ():boolean {return this.mDir===1 || this.mDir===2;}
    public get dir() {return this.mDir;}

    public MkMovementCode() : number  // for history and search nodes
    { // |4-bit affected1|4-bit affected0|3-bit man dir|
      let code=this.mDir;
      if (this.mAffected && this.mAffected.length>0)
      {
        code|= ((8+this.mAffected[0].y*3+this.mAffected[0].x)<<3);
        if (this.mAffected.length>1)
          code|= ((8+this.mAffected[1].y*3+this.mAffected[1].x)<<6);
      }
      return code;
    } // Movement::MkMovementCode()

    constructor(dir:number, affected1:Coord=null, affected2:Coord=null)
    {
      this.mDir=dir;
      if (affected1===null) {
        this.mAffected=null;
      }
      else {
        this.mAffected = [];
        this.mAffected[0]=affected1;
        if (affected2!==null)
          this.mAffected[1]=affected2;
      }
      this.mShift = new Delta(dir);
      this.UndoingQ=false;
    } // ctor()

    SetUndoingFlag() {this.UndoingQ=true;}

    public CellShift(cell:Coord):Delta
    {
      if (this.mAffected!==null
      &&  (cell.eq(this.mAffected[0])
        || (this.mAffected.length===2 && cell.eq(this.mAffected[1]))))
      {
        return this.mShift;
      }
      else return null;
    } // Movement::CellShift()

    public ManShift():Delta
    {
      return this.mAffected===null ? this.mShift : null; //sNoShift;
    } // Movement::ManShift()
  } // class Movement


  //**********************************************************
  //     ______                     __                   __
  //    / ____/___ _____ ___  ___  / /   ___ _   _____  / /
  //   / / __/ __ `/ __ `__ \/ _ \/ /   / _ \ | / / _ \/ /
  //  / /_/ / /_/ / / / / / /  __/ /___/  __/ |/ /  __/ /
  //  \____/\__,_/_/ /_/ /_/\___/_____/\___/|___/\___/_/
  //
  //***********************************************************
  class GameLevel
  {
    //['x', '┘', '└', '┌', '┐', '↓', '↑', '→', '←', '╝', '╚', '╔', '╗', '═', '║'];
    //  0    1    2    3    4    5    6    7    8    9    10   11   12   13   14
    private mLayout: string;  // 9 Cell symbols.
    private mManX:number;
    private mManY:number;
    private mIcon: HTMLCanvasElement;
    private mMinNMoves:number;      // BFS solver result. dynamically computed once.
    private mUsrMinNMoves:number;   // User's best unaided record so-far. 9e9 if never successfully exited.
    public  Thumbnail:HTMLCanvasElement;
    get minNMoves() {return this.mMinNMoves;}
    set minNMoves(n: number) {this.mMinNMoves=n;}
    get usrMinNMoves() {return this.mUsrMinNMoves;}
    get layoutKey() {return K.CK_UsrMinMove + this.mLayout+this.mManX+this.mManY;}
    constructor(layout:string, manX:number, manY:number)
    {
      this.mLayout=layout;
      this.mManX  =manX;
      this.mManY  =manY;
      this.mMinNMoves=-1;
      this.mIcon  =null; //document.createElement('canvas');
      this.Thumbnail=null;
      this.mUsrMinNMoves=9e9;
      // check if there is a user record in LocalStorage.
      // const brd = new Board(this);
      const key = this.layoutKey;
      const nmv = GetCookie(key);
      if (nmv && +nmv>0)
      {
        this.mUsrMinNMoves=+nmv;
      }
    } // constructor()

    public UpdateUsrMinNMoves(n:number)
    {
      if (n>0 && n<1e5 && n<this.mUsrMinNMoves)
        this.mUsrMinNMoves=n;
    }

    public SetupBoard(brd:Board)
    {
      brd.SetLayout(this.mLayout, this.mManX, this.mManY);
    }

    public GetIcon() : HTMLCanvasElement
    {
      return this.mIcon;
    }

  } // class GameLevel


  //***********************************************************
  //      ____                       __
  //     / __ )____  ____ __________/ /
  //    / __  / __ \/ __ `/ ___/ __  /    : Game board class
  //   / /_/ / /_/ / /_/ / /  / /_/ /
  //  /_____/\____/\__,_/_/   \__,_/
  //
  //***********************************************************
  class Board
  {
    private static sBaseImg  :HTMLImageElement=null;
    private static sShadowImg:HTMLImageElement=null;
    private static sTopImg   :HTMLImageElement=null;

    private static sSclCanvs: HTMLCanvasElement[]=[];
    private static sSclCanvScl=-1;

    private static sImgLoadedFlags=0;

    private static onImgLoaded(which:number)
    {
      Board.sImgLoadedFlags|=which;
      console.log("board img "+which+" loaded");
      if (Board.sImgLoadedFlags===7)
        G.ImagesReady(K.kBoardImgsReady);
    } // Board.onImgLoaded() //

    public static LoadImages()
    {
      Board.sBaseImg=new Image();
      Board.sBaseImg.onload=()=>{Board.onImgLoaded(1);}
      Board.sBaseImg.src="rsrc/BoardBot.jpg";
      Board.sShadowImg=new Image();
      Board.sShadowImg.onload=()=>{Board.onImgLoaded(2);}
      Board.sShadowImg.src="rsrc/BoardShdw.webp";
      Board.sTopImg=new Image();
      Board.sTopImg.onload=()=>{Board.onImgLoaded(4);}
      Board.sTopImg.src="rsrc/BoardTop.webp";
    } // Board.LoadImages()

    //------------------------------------------------------- data members and methods

    mRoomTypes:Cell[];  // max length=8
    mCells:number[][];  // each cell is an index into mRoomTypes. -1 means the no-room cell.
    mManPos:Coord;
    mExitedQ:boolean;

    get exitedQ() {return this.mExitedQ;}
    get manCell() {return this.Cell(this.mManPos);}

    get ManPos() {return this.mManPos;}

    public NoRoomQ(x:number, y:number): boolean
    {
      return x>=0 && x<3 && x>=0 && y<3 && this.mCells[x][y]<0;
    } // Board::NoRoomQ()

    public SetLayout(layout:string, manX:number, manY:number)
    {
      this.mRoomTypes=[];
      for (let i=0; i<9; i++)
      {
        const x=i%3;
        const y=Math.floor(i/3);
        const sym:string = layout.substring(i, i+1);
        const cellType=Cell.SymToType(sym);
        if (cellType<=0)
        {
          this.mCells[x][y]=-1;
        }
        else
        {
          let i=0;
          for (; i<this.mRoomTypes.length && cellType!==this.mRoomTypes[i].type; i++) {}
          if (i>=this.mRoomTypes.length)
            this.mRoomTypes.push(new Cell(sym));
          this.mCells[x][y]=i;
        }
      } // for (i)

      this.mManPos = new Coord(manX, manY);
      this.mExitedQ = false;
    } // Board::SetLayout()

    constructor(layout:GameLevel|number, manPos:number=0, xPos:number=0)
    {
      this.mExitedQ=false;
      this.mManPos = new Coord(0,0);
      this.mCells=[[],[],[]];
      this.mRoomTypes=[];
      if (layout instanceof GameLevel)
        layout.SetupBoard(this);
      else
      {
        let manX=-1, manY=0;
        if (manPos>=0 && manPos<9)
        {
          manX=manPos%3;
          manY=Math.floor(manPos/3);
        }
        this.SetLayout(Cell.LayoutFrom4bitCells(layout, xPos), manX, manY);
      } // layout-4-bit-cells, manPos, xPos for BFSSolver
    } // Board constructor()

    public MkLayoutCode() : number  // generate a unique code to denote the current board cell and man position.
    {
      let manPos = (this.mManPos.x+this.mManPos.y*3) + 1; // 0 means exited.
      let noRoomPos = 0;
      let layoutCode = 0;
      for (let y=0; y<3; y++)
      {
        for (let x=0; x<3; x++)
        {
          if (this.mCells[x][y]>=0)
            layoutCode = (layoutCode<<3) + this.mCells[x][y];
          else
            noRoomPos=y*3+x;
        } // for (y) for (x)
      }
      return ((manPos*9 + noRoomPos)<<24) + layoutCode;
    } // Board::MkLayoutCode()

    static getManPos(config:number) {return Math.floor((config>>24)/9);}
    static getXPos(config:number) {return (config>>24)%9;}

    public ManInCellQ(x:number|Coord, y:number=-1) : boolean
    {
      if (x instanceof Coord)
        return this.mManPos.eq(x);
      else
        return this.mManPos.x===x && this.mManPos.y===y;
    } // Board::ManInCellQ()

    public NoRoomCoord() : Coord
    {
      for (let y=0; y<3; y++)
        for (let x=0; x<3; x++)
        {
          if (this.mCells[x][y]<0) return new Coord(x, y);
        }
      return null;
    } // Board::NoRoomCoord()

    public ExitMoveQ(move:Movement) : boolean
    {
      return (move!==null
      && this.mManPos.x===0 && this.mManPos.y===0
      && move.manMoveQ && move.dir===3
      && this.CellXY(0,0).Connector(3)===2);
    } // Board::ExitMoveQ()

    public static _idxToCoord(i:number) : Coord
    {
      return new Coord(i%3, Math.floor(i/3));
    } // Board._idxToCoord()

    private Cell0_8(idx0_8:number) :Cell
    {
      return this.CellXY(idx0_8%3, Math.floor(idx0_8/3));
    } // Board::Cell0_8()

    private CellXY(cX:number, cY:number) : Cell
    {
      if (cX>=0 && cX<3 && cY>=0 && cY<3)
      {
        const roomTypeIdx=this.mCells[cX][cY];
        return roomTypeIdx<0 ? null : this.mRoomTypes[roomTypeIdx];
      }
      else
        return null;
    } // Board::CellXY()

    private Cell(pos:Coord, shf:Delta|number|null=null) : Cell
    {
      let cX=pos.x, cY=pos.y;
      if (shf!==null) {
        if (shf instanceof Delta) {
          cX+=shf.dx;
          cY+=shf.dy;
        }
        else if (typeof(shf)==='number') {
          switch (shf) {
            case 0: cY--; break;
            case 1: cX++; break;
            case 2: cY++; break;
            case 3: cX--; break;
          }
        }
      }
      return this.CellXY(cX,cY);
    } // Board::Cell()

    // The following 2 functions are for BFS Solver interfacing usages only
    public GetCellArray() : number[]
    {
      const cells:number[]=[];
      for (let y=0; y<3; y++)
        for (let x=0; x<3; x++)
          cells.push(this.mCells[x][y]<0 ? 0 : this.mRoomTypes[this.mCells[x][y]].mType);
      return cells;
    } // Board::GetCellArray()

    public GetManPos0_9() : number
    {
      return this.mExitedQ ? 9 : (this.mManPos.y*3+this.mManPos.x);
    }

    private static _Frnt2Bck_R2L=[8,5,2,7,4,1,6,3,0];
    private static _R2L_Frnt2Bck=[8,7,6,5,4,3,2,1,0];
    private static _Bck2Frnt=[0,1,2,3,4,5,6,7,8];
    private drawRooms(ctx:CanvasRenderingContext2D,
      brdL:number, brdT:number, brdScl:number, layer:number,
      activeMove:Movement, animFrac:number)
    {
      const roomOffsetX=K.kRoomOffsetX * brdScl;
      const roomOffsetY=K.kRoomOffsetY * brdScl;
      const roomOrder:number[]=
        layer>0 ? Board._Bck2Frnt
      : (activeMove===null || (activeMove && !activeMove.manMoveQ && !activeMove.yMoveQ)) ? Board._R2L_Frnt2Bck
      : Board._Frnt2Bck_R2L;

      for (let i=0; i<9; i++) {
        const cellCoord=Board._idxToCoord(roomOrder[i]);
        const cell=this.Cell(cellCoord);
        if (cell) cell.Draw(ctx,
                            brdL+roomOffsetX,
                            brdT+roomOffsetY,
                            cellCoord, brdScl, layer,
                            activeMove, animFrac, false);
      } // for (i)

      if (layer===1) {
        let manCell=this.Cell(this.mManPos);
        let manPos =this.mManPos;
        if (manCell===null && this.exitedQ)
        {
          manPos = new Coord(0,0);
          manCell = this.Cell(manPos);
          if (activeMove && activeMove.UndoingQ)
          {
            animFrac = (1-animFrac)*K.ExitAnimFracLimit;  // reverse the fraction to make it come back from the exit.
          }
          else
          {
            animFrac = K.ExitAnimFracLimit;
          }
          activeMove = new Movement(3);
        }
        if (manCell) manCell.Draw(ctx,
                                  brdL+roomOffsetX,
                                  brdT+roomOffsetY,
                                  manPos, brdScl, layer,
                                  activeMove, animFrac, true);
      }
    } // Board::drawRooms()

    public HitTest(
      canvw:number, canvh:number,
      cvX:number, cvY:number) : {cellPos:Coord, onManQ:boolean, offCtrDir:number}|null
    {
      // console.log("HitTest("+canvw+","+canvh+","+cvX+","+cvY+")");
      const manExitSpace=K.kManExitSpace;  // as a fraction of the board image width
      const sz=Math.min(canvw, canvh);
      const brdW=Board.sBaseImg.width;
      const brdH=Board.sBaseImg.height;
      const brdScl= sz/Math.max(brdW*(1+manExitSpace), brdH);
      const brdL=Math.floor((canvw-brdW*(1-manExitSpace)*brdScl)/2);
      const brdT=Math.floor((canvh-brdH*brdScl)/2);

      const rmX=(cvX-brdL)/brdScl-K.kRoomOffsetX;
      const rmY=(cvY-brdT)/brdScl-K.kRoomOffsetY;
      const cellX=Math.floor(rmX/K.kRoomWidth);
      const cellY=Math.floor(rmY/K.kRoomHeight);
      if (cellX>=0 && cellY<3 && cellY>=0 && cellY<3) {
        let manHitQ=false;
        let offCtrDir=-1;
        if (this.ManInCellQ(cellX, cellY)) {  // the cell has the Man in it alright...
          // Calculate how far off center is the click.
          const offctrX=((rmX/K.kRoomWidth)%1 - 0.5)*K.kRoomWidth;
          const offctrY=((rmY/K.kRoomHeight)%1 - 0.5)*K.kRoomHeight;
          function sq(x:number) {return x*x;}
          // check if the (offctrX,offctrY) is within the ellipse with half-radii:(ManImgOffCenterX, ManImgOffCenterY)
          manHitQ = sq(offctrX/K.ManImgOffCenterX)+sq(offctrY/K.ManImgOffCenterY)<1.0;
          if (!manHitQ) {
            // not within the pawn oval. Check if it is a clear directional offsetted click.
            if (Math.abs(offctrX)<K.ManImgOffCenterX &&
                Math.abs(offctrY)>K.ManImgOffCenterY) offCtrDir=offctrY<0 ? 0 : 2;
            else if (Math.abs(offctrY)<K.ManImgOffCenterY &&
                    Math.abs(offctrX)>K.ManImgOffCenterX) offCtrDir=offctrX<0 ? 3 : 1;
          }
        }
        return {cellPos:new Coord(cellX, cellY), onManQ:manHitQ, offCtrDir:offCtrDir};
      }
      else
        return null;
    } // Board::HitTest()

    private static PrepScaledBoardCanvs(scl:number)
    {
      if (scl!==Board.sSclCanvScl)
      {
        const imgs=[Board.sBaseImg, Board.sShadowImg, Board.sTopImg];
        for (let i=0; i<3; i++)
        {
          const img = imgs[i];
          const canv = Board.sSclCanvs[i] = document.createElement('canvas');
          canv.width =Math.floor(scl*img.width);
          canv.height=Math.floor(scl*img.height);
          const ctx=canv.getContext('2d');
          ctx.drawImage(img,0,0,img.width,img.height, 0,0,canv.width,canv.height);
        }
      }
    } // Board.PrepScaledBoardCanvs()

    //----------------------------------------------------------------
    //  Draw(): Render the game board with room tiles and man piece
    //----------------------------------------------------------------
    public Draw(ctx:CanvasRenderingContext2D,
      canvw:number, canvh:number,
      activeMove:Movement, animFrac:number, iconQ=false)
    {
      ctx.imageSmoothingQuality="high";
      if (Board.sImgLoadedFlags===7)
      {
        const manExitSpace=iconQ ? 0 : K.kManExitSpace;  // as a fraction of the board image width
        const sz=Math.min(canvw, canvh);
        const brdW=Board.sBaseImg.width;
        const brdH=Board.sBaseImg.height;
        const brdScl= sz/Math.max(brdW*(1+manExitSpace), brdH);
        const brdL=Math.floor((canvw-brdW*(1-manExitSpace)*brdScl)/2);
        const brdT=Math.floor((canvh-brdH*brdScl)/2);

        Board.PrepScaledBoardCanvs(brdScl);

        // Board base layer
        // ctx.drawImage(Board.sBaseImg, brdL, brdT, brdW*brdScl, brdH*brdScl);
        ctx.drawImage(Board.sSclCanvs[0], brdL, brdT);

        // Rooms base layer
        this.drawRooms(ctx, brdL, brdT, brdScl, 0, activeMove, animFrac);

        // Board shadow
        ctx.drawImage(Board.sSclCanvs[1], brdL, brdT);
        // ctx.drawImage(Board.sShadowImg, brdL, brdT, brdW*brdScl, brdH*brdScl);

        // Rooms top layer (and Man in between)
        this.drawRooms(ctx, brdL, brdT, brdScl, 1, activeMove, animFrac);

        // Board top layer
        ctx.drawImage(Board.sSclCanvs[2], brdL, brdT);
        // ctx.drawImage(Board.sTopImg, brdL, brdT, brdW*brdScl, brdH*brdScl);
      } // if (sImgLoadedFlags===7)
    } // Board::Draw()

    //----------------------------------------------------------
    //  Movement logic
    //----------------------------------------------------------
    public ManCanMoveTowardsQ(dir:number, from:Coord|null=null) : number // 0 no-way, 1:can-go, 2:exiting
    {
      if (from===null) from=this.mManPos;
      const fromCell=this.Cell(from);
      if (fromCell===null && dir===1) // special case: moving from the exited (-1,0) pos back into (0,0)
      { // This block is added for handling backwacd tracing from the exit position. (from G.AutoMove())
        const to=new Coord(from,dir);
        const conn=2;
        const toCell=this.Cell(to);
        if (toCell && !toCell.noRoomQ && conn && conn===toCell.Connector((dir+2)%4))
          return 1;
        else
          return 0;
      }
      else if (fromCell===null || fromCell.level===0)
        return 0;
      else {
        const to=new Coord(from,dir);
        if (to.x===-1 && to.y===0 && fromCell.Connector(dir)===2) // exiting
          return 2;
        else
          return fromCell.CanGoIntoQ(this.Cell(to), dir) ? 1 : 0;
      }
    } // Board::ManCanMoveTowardsQ()

    public GenManMovements(dir:number) : {moves:Movement[]|null, noEffectQ:boolean}
    {
      let moves:Movement[]|null=null;
      let noEffectQ=false;

      let frm=this.Cell(this.mManPos);
      if (frm
      ||  (frm===null && dir===1)) // frm===null && dir===1 means going into the maze from the exited -1,0 man pos.
      {
        let shf = new Delta(dir);
        let canMoveType:number=0;
        if (0===(canMoveType=this.ManCanMoveTowardsQ(dir)))
        {
          noEffectQ=true;
          // An impossible move: if it is not towards a wall, queue it
          // anyway to generate a half-move return animation effect cue.
          if (frm.Connector(dir)!==0)
            moves=[new Movement(dir)];
        }
        else
        {
          moves=[new Movement(dir)];
          if (canMoveType===2) {
            this.mExitedQ=true;
          }
          else {
            // int px=playerPos.x+shf.dx, py=playerPos.y+shf.dy;
            let pos = new Coord(this.mManPos, shf);
            let frmdir=(dir+2)%4;
            while (this.Cell(pos).level!==1) {
              // search for an exit dir from (px,py) cell
              let exitDir:number=-1;
              for (let d=0; d<4; d++) {
                if (d!==frmdir && 0!==(canMoveType=this.ManCanMoveTowardsQ(d, pos))) {
                  exitDir=d;
                  break;
                }
              } // for (d)
              if (exitDir>=0)
                dir=exitDir;
              else
              {
                dir=frmdir; noEffectQ=true;
              }
              moves.push(new Movement(dir));
              pos = new Coord(pos, dir);
              frmdir=(dir+2)%4;
              if (canMoveType===2) // exited
              {
                this.mExitedQ=true;
                break;
              }
            } // while
          }
        } // if (canMoveTowardsQ)
      } // if (!frm.vacantQ)
      return moves && moves.length ? {moves:moves, noEffectQ:noEffectQ} : null;
    } // Board::GenManMovements()

    public ManCanReach(target:Coord) : number // returns a dir or -1 if not reachable
    {
      let mandir;
      for (mandir=0; mandir<4; mandir++)
      {
        let dir=mandir;
        let frm=this.Cell(this.mManPos);
        if (frm
        ||  (frm===null && dir===1)) // frm===null && dir===1 means going into the maze from the exited -1,0 man pos.
        {
          let shf = new Delta(dir);
          let canMoveType:number=0;
          if (0===(canMoveType=this.ManCanMoveTowardsQ(dir)))
          {
            // An impossible move
            continue;
          }
          else
          {
            if (canMoveType===2) {  // exited before reaching target
              continue;
            }
            else {
              let pos = new Coord(this.mManPos, shf);
              if (pos.eq(target))
                return mandir;
              let deadEndQ=false;
              let frmdir=(dir+2)%4;
              while (this.Cell(pos).level!==0)
              {
                // search for an exit dir from (px,py) cell
                let exitDir:number=-1;
                for (let d=0; d<4; d++) {
                  if (d!==frmdir && 0!==(canMoveType=this.ManCanMoveTowardsQ(d, pos))) {
                    exitDir=d;
                    break;
                  }
                } // for (d)
                if (exitDir>=0)
                  dir=exitDir;
                else
                {
                  deadEndQ=true;
                  break;
                }
                pos = new Coord(pos, dir);
                if (pos.eq(target))
                  return mandir;
                frmdir=(dir+2)%4;
                if (canMoveType===2) // exited
                {
                  deadEndQ=true;
                  break;
                }
              } // while

              if (deadEndQ)
                continue; // try next dir.
            }
          } // if (canMoveTowardsQ)
        } // if (!frm.vacantQ)
      }
      return -1;
    } // Board::ManCanReach()

    public GenMovement(pos:Coord, dir:number=-1) : {moves:Movement[]|null, noEffectQ:boolean}
    {
      let moveInfo:{moves:Movement[]|null, noEffectQ:boolean}=null;

      if (pos===null || pos.eq(this.mManPos))
      {
        if (dir>=0) moveInfo=this.GenManMovements(dir);
      }
      else
      {
        const cell=this.Cell(pos);
        if (cell && !cell.noRoomQ)
        {
          // Identify the no-room cell's coordinates
          let vX=0;
          let vY=0;
          for (let i=0; i<9; i++) {
            if (this.Cell0_8(i)===null) {
              vX=i%3;
              vY=Math.floor(i/3);
              break;
            }
          } // for (i)

          const moves=[];
          if (pos.x===vX)   // a vertical room shift
          {
            const dy=vY-pos.y;
            if (Math.abs(dy)>1) {
              if (this.mManPos.x!==vX)
                moves.push(new Movement(dy>0 ? 2 : 0, pos, new Coord(pos.x, pos.y+dy/2)));
            }
            else
              moves.push(new Movement(dy>0 ? 2 : 0, pos));
          }
          else if (pos.y===vY)  // a horizontal room shift
          {
            const dx=vX-pos.x;
            if (Math.abs(dx)>1) {
              if (this.mManPos.y!==vY)
                moves.push(new Movement(dx>0 ? 1 : 3, pos, new Coord(pos.x+dx/2, pos.y)));
            }
            else
              moves.push(new Movement(dx>0 ? 1 : 3, pos));
          }
          if (moves.length) moveInfo={moves:moves, noEffectQ:false};
        }
      }
      return moveInfo;
    } // Board::GenMovement()

    public CommitMove(move:Movement)
    {
      const cells=this.mCells;
      function _swapCells(fromx:number, fromy:number, tox:number, toy:number)
      {
        const tmp=cells[tox][toy];
        cells[tox][toy]=cells[fromx][fromy];
        cells[fromx][fromy]=tmp;
      } // helper local functions _swapCells()

      if (move!==null) {
        if (move.manMoveQ) {
          if (this.ManCanMoveTowardsQ(move.dir))  // commit only valid man movements.
          {
            const shf = move.ManShift();
            this.mManPos.x+=shf.dx;
            this.mManPos.y+=shf.dy;
            this.mExitedQ = this.mManPos.x===-1 && this.mManPos.y===0;
          }
        }
        else if (move.positiveQ) {
          for (let y=2; y>=0; y--) for (let x=2; x>=0; x--) {
            const shf = move.CellShift(new Coord(x,y));
            if (shf) _swapCells(x,y,x+shf.dx,y+shf.dy);
          } // for (y) for (x)
        }
        else {
          for (let y=0; y<3; y++) for (let x=0; x<3; x++) {
            const shf = move.CellShift(new Coord(x,y));
            if (shf) _swapCells(x,y,x+shf.dx,y+shf.dy);
          } // for (y) for (x)
        }
      } // if (move)
    } // Board::CommitMove()

  } // class Board


  interface UndoInfo
  {
    config: number,   // BFSSolve type 31-bit BoardConfig code
    move0:  number,   // 16-bit movement info (manMov or xShf)
    finalMove: number // 16-bit movement info
  };


  //**********************************************
  //     ______
  //    / ____/
  //   / / __   : The Game Namespace
  //  / /_/ /
  //  \____/
  //
  //**********************************************
  class G
  {
    static Canv:HTMLCanvasElement=null;
    static MazeDiv:HTMLDivElement=null;
    static BtnsDiv:HTMLDivElement=null;
    static AboutBoxDiv:HTMLDivElement=null;
    static MvCountDiv:HTMLDivElement=null;
    static SpinnerDiv:HTMLDivElement=null;
    static UndoBtn:HTMLButtonElement=null;
    static AutoBtn:HTMLButtonElement=null;
    static RestartBtn:HTMLButtonElement=null;
    static LevelPickerDiv:HTMLDivElement=null;
    static NavBtn:HTMLButtonElement=null;
    static NavInfoDiv:HTMLDivElement=null;
    static SoundOnOffBtn:HTMLButtonElement=null;
    static RoomSound:HTMLAudioElement=null;
    static RoomSoundReadyQ=false;
    static WalkSound:HTMLAudioElement=null;
    static WalkSoundReadyQ=false;
    static SoundOnQ=false;
    static UnaidedQ=true    // if the robot has not been invoked.

    static CanvasResScale:number = window.devicePixelRatio || 1;
    // static CanvasResScale:number = 1.7;  // for debugging on a desktop.

    static GameBoard:Board=null;
    static CurrLevel:GameLevel=null;
    static CurrLevelN=-1;

    static GameLevels:GameLevel[]=[];

    // Some modal states
    static PickingLevelQ=false;
    static ShowingAboutBoxQ=false;
    static BFSSolvingQ=false;
    static WasmSolverReadyQ=false;

    static NavOnQ=false;
    static NavInfo:number[]=[];       // Cached nav-info (i.e. min-n-moves to exit) indexed directly using board layout code.
    static NavSolverTimer=-1;

    static PendingMoves:Movement[]=[];
    static MoveAnimTimer:number=-1;
    static MoveAnimStartTime=0;
    static MoveDuration=K.MoveDuration; // in msec
    static ValidManDragDirs:number[]=null;

    static MoveHistory:number[]=[];
    static BoardHistory:number[]=[];  // 31-bits layout code

    static ImagesReadyFlags=0;

    static ImagesReady(whichImages:number)
    {
      G.ImagesReadyFlags|=whichImages;
      if (G.ImagesReadyFlags===K.kAllImgsReady)
      {
        console.log("All images loaded. calling Redraw() for the 1st time.");
        G.Redraw();
      }
    } // G.ImagesReady()

    private static PrepingLevelN=-1;
    static PrepGameLevels()
    {
      if (G.GameLevels.length>0 && G.PrepingLevelN<G.GameLevels.length)
      {
        if (G.PrepingLevelN<0) G.PrepingLevelN=0;
        G.BFSSolvingQ=true;
        const lvl = G.GameLevels[G.PrepingLevelN];
        const brd = new Board(lvl);
        LAvenWorker.postMessage(
          {
            'cmd':    'LvlPrep',
            'layout': brd.MkLayoutCode(),
            'cells':  brd.GetCellArray(),
            'manPos': brd.GetManPos0_9(),
            // cells:[0,9,1,7,7,13,2,3,12],
            // manPos: 6,
          });
      }
    } // G.PrepGameLevels()

    static SetGameLevelSolution(_layout:number, nmoves:number)
    {
      if (G.GameLevels.length>0 && G.PrepingLevelN>=0 && G.PrepingLevelN<G.GameLevels.length)
      {
        G.GameLevels[G.PrepingLevelN].minNMoves=nmoves;
        G.PrepingLevelN++;
        if (G.PrepingLevelN<G.GameLevels.length)
          G.PrepGameLevels();
        else if (G.NavOnQ)
          G.GetNavInfoForCurrLayout();
      }
    } // G.SetGameLevelSolution() //

    static FillLevelPicker()
    {
      const list=byId('gmLvlListDiv') as HTMLDivElement;
      while (list.firstChild) list.removeChild(list.lastChild);

      const canv128 = document.createElement('canvas') as HTMLCanvasElement;
      const s128 = G.CanvasResScale*128;
      const s64 = G.CanvasResScale*64;
      canv128.width=s128;
      canv128.height=s128;
      canv128.style.backgroundColor='transparent';
      const ctx128=canv128.getContext('2d');

      let showThisDiv:HTMLDivElement|null=null;

      for (let i=0; i<G.GameLevels.length; i++)
      {
        const lvl = G.GameLevels[i];
        const div = document.createElement('div') as HTMLDivElement;
        let canv = lvl.Thumbnail;

        if (canv===null)  // thumbnail image not created yet. create one.
        {
          canv = document.createElement('canvas') as HTMLCanvasElement;
          canv.width=s64;
          canv.height=s64;
          const ctx = canv.getContext('2d');

          ctx128.clearRect(0,0,s128,s128);
          const brd = new Board(lvl);
          brd.Draw(ctx128, s128, s128, null, 0, true/* as an icon */);
          ctx.drawImage(canv128, 0,0, s128,s128, 0,0, s64,s64);
          canv.style.width="64px";
          canv.style.height="64px";
          canv.style.backgroundColor="transparent";
          lvl.Thumbnail=canv;
        }

        div.appendChild(canv);

        let lvltxt ="<span>Level "+(i+1)+"</span>";
        if (lvl.minNMoves>0)
          lvltxt+="<br><div class='diffTxt'>"+K.HTM_DiffRate[Math.floor(lvl.minNMoves/5)]+"</div>";
        if (lvl.usrMinNMoves>0 && lvl.usrMinNMoves<1e5)
        {
          lvltxt+="<br><span class='usrBest'>Exited in "+lvl.usrMinNMoves;
          if (lvl.minNMoves===lvl.usrMinNMoves) lvltxt+=" *";
          lvltxt+=" moves</span>";
        }

        const txtdiv = document.createElement('div') as HTMLDivElement;
        txtdiv.innerHTML = lvltxt;

        div.appendChild(txtdiv);
        div.addEventListener('click', ()=>{G.SelectGameLevel(i);});
        div.style.cursor='pointer';

        if (i===G.CurrLevelN)
        {
          AddClass(div, K.CSS_SelectedLvl);
        }
        if (i===G.CurrLevelN-1 || (G.CurrLevelN===0 && i===0))
        {
          showThisDiv=div;
        }

        list.appendChild(div);
      } // for (i)

      if (showThisDiv)
        showThisDiv.scrollIntoView();
    } // G.FillLevelPicker()

    static SelectGameLevel(lvl:number)
    {
      if (G.ShowHideLevelPicker(false) && lvl>=0 && lvl<G.GameLevels.length)
      {
        // G.CurrLevel = G.GameLevels[lvl];
        // G.CurrLevelN=lvl;
        SetCookie(K.CK_LastLevel, lvl.toString());
        // G.UserCommand('restart');
        G.StartLevel(lvl);
      }
    } // G.SelectGameLevel()

    static ShowHideLevelPicker(showQ:boolean) : boolean
    {
      if (!G.BFSSolvingQ && G.PendingMoves.length===0)
      {
        G.LevelPickerDiv.hidden = !showQ;
        if (showQ)
        {
          G.FillLevelPicker();
        }
        G.PickingLevelQ=showQ;
        return true;
      }
      else
        return false;
    } // G.ShowHideLevelPicker()

    static ShowHideAboutBox(showQ:boolean) : boolean
    {
      if (!G.BFSSolvingQ && G.PendingMoves.length===0 && G.AutoMoveQueue.length===0)
      {
        G.AboutBoxDiv.hidden = !showQ;
        G.ShowingAboutBoxQ=showQ;
        if (showQ)
        {
          G.updateMaxHeight();
        }
        return true;
      }
      else
        return false;
    } // G.ShowHideAboutBox()

    //    ___        _
    //   | _ \___ __| |_ _ __ ___ __ __
    //   |   / -_) _` | '_/ _` \ V  V /
    //   |_|_\___\__,_|_| \__,_|\_/\_/
    //
    static Redraw(activeMove:Movement=null, animFrac:number=0)
    {
      const scl = G.CanvasResScale;
      const canv=G.Canv;
      if (canv) {
        const ctx = canv.getContext("2d");
        const w=canv.width;
        const h=canv.height;
        ctx.clearRect(0,0,w,h);

        if (G.GameBoard)
          G.GameBoard.Draw(ctx, w,h, activeMove, animFrac);
      } // if (canv)
    } // G.Redraw()

    private static PushHistory(layoutCode:number, firstMoveCode:number, finalMoveCode:number)
    {
      if (firstMoveCode<0 || firstMoveCode>=65536
      ||  finalMoveCode<0 || finalMoveCode>=65536) throw "coding error";
      G.BoardHistory.push(layoutCode);
      G.MoveHistory.push((firstMoveCode<<16) + (finalMoveCode));
    }
    private static NHistories() {return G.BoardHistory.length;}
    private static PopHistory() : UndoInfo //{config:number, move0:number, finalMove:number}
    {
      if (G.NHistories()>0)
      {
        const mv = G.MoveHistory.pop();
        return {config:G.BoardHistory.pop(), move0:(mv>>16), finalMove:(mv&0xffff)};
      }
      else
        return null;
    } // G.PopHistory()

    private static AppendMoves(cellPos:Coord, manDir:number) : boolean
    {
      let moveAddedQ=false;
      if (G.NavSolverTimer!==-1)
      {
        clearTimeout(G.NavSolverTimer);
        G.NavSolverTimer=-1;
      }

      const moveInfo = G.GameBoard.GenMovement(cellPos, manDir);
      if (moveInfo)
      {
        G.PendingMoves =G.PendingMoves.concat(moveInfo.moves);
        if (!moveInfo.noEffectQ)  // record move history
        {
          G.PushHistory(G.GameBoard.MkLayoutCode(),
                        moveInfo.moves[0].MkMovementCode(),
                        moveInfo.moves[moveInfo.moves.length-1].MkMovementCode());
          // if (G.MvCountDiv)
          //   G.MvCountDiv.innerHTML=G.NHistories().toString();
        } // if (!moveInfo.noEffectQ)
        moveAddedQ=true;
      } // if (moveInfo)

      if (G.PendingMoves.length>0 && G.MoveAnimTimer===-1)
      {
        G.MoveAnimStartTime=performance.now();
        G.MoveAnimTimer=window.setTimeout(G.AnimatePendingMoves, K.AnimTimerStep);
      }
      G.UpdateUI();
      return moveAddedQ;
    } // G.AppendMoves()

    private static CommitEarliestMove()
    {
      if (G.PendingMoves.length>0) {
        G.GameBoard.CommitMove(G.PendingMoves[0]);
        G.PendingMoves.splice(0,1);
      }
    } // G.CommitEarliestMove()

    static AutoMoveQueue: Movement[][]=[];
    static InterruptAutoMovesQ=false;
    static AutoMove(nMoves:number, moves:number[])
    {
      G.AutoMoveQueue=[];

      let frmBoard = G.GameBoard;
      let errorQ=false;
      for (let i=0; i<nMoves && !errorQ; i++)
      {
        const moveSeq:Movement[]=[];

        const rooms=moves[i*2];
        const moveInfo=moves[i*2+1];  // top 16 bits: manXPos. lower 3 bits:move dir + type
        const manXPos = moveInfo>>16;
        // if (manXPos>=81) break;
        let toBoard = new Board(rooms, Math.floor(manXPos/9), manXPos%9);
        const movdir = moveInfo&3;
        const xShfQ  = (moveInfo&4)!==0;
        if (xShfQ)
        {
          let toXPos = Board._idxToCoord(manXPos%9);
          let frmXPos = frmBoard.NoRoomCoord();
          let mv1:Coord=new Coord(toXPos.x, toXPos.y);  // the new hole is always an 'affected' cell.
          let mv2:Coord=null;
          switch ((movdir+2)%4)
          {
          case 0: // x-shf up
            if (toXPos.y-frmXPos.y===-2)
              mv2 = new Coord(toXPos.x, toXPos.y+1);
            break;
          case 1: // x-shf right
            if (toXPos.x-frmXPos.x===2)
              mv2 = new Coord(toXPos.x-1, toXPos.y);
            break;
          case 2: // x-shf down
            if (toXPos.y-frmXPos.y===2)
              mv2 = new Coord(toXPos.x, toXPos.y-1);
            break;
          case 3: // x-shf left
            if (toXPos.x-frmXPos.x===-2)
              mv2 = new Coord(toXPos.x+1, toXPos.y);
            break;
          } // switch
          moveSeq.push(new Movement(movdir, mv1, mv2));
        }
        else  // a man Move (potentially a multi-step one)
        {
          let manMoves = toBoard.GenManMovements(movdir);
          if (!manMoves.noEffectQ && manMoves.moves!==null && manMoves.moves.length>0)
          {
            const mmv=manMoves.moves;
            for (let j=mmv.length-1; j>=0; j--)
            {
              moveSeq.push(new Movement((mmv[j].dir+2)%4));
            }
          }
          else
            errorQ=true;
        }

        if (moveSeq.length>0)
        {
          G.AutoMoveQueue.push(moveSeq);
          // G.PendingMoves=G.PendingMoves.concat(moveSeq);
          // G.PushHistory(frmBoard.MkLayoutCode(),
          //               moveSeq[0].MkMovementCode(),
          //               moveSeq[moveSeq.length-1].MkMovementCode());
        } // if (moveSeq.length>0)

        frmBoard=toBoard;
      } // for (i=0..nMoves)

      // if (G.PendingMoves.length>0 && G.MoveAnimTimer===-1) {
      //   G.MoveAnimStartTime=performance.now();
      //   G.MoveAnimTimer=window.setTimeout(G.AnimatePendingMoves, K.AnimTimerStep);
      // }
      if (G.AutoMoveQueue.length>0) {
        G.InterruptAutoMovesQ=false;
        G.PlayAutoMoves();
      }
    } // G.AutoMove()

    static PlayAutoMoves()
    {
      if (G.AutoMoveQueue.length>0 && G.MoveAnimTimer===-1 && G.PendingMoves.length===0)
      {
        if (G.InterruptAutoMovesQ)
        {
          G.AutoMoveQueue=[];
          G.GetNavInfoForCurrLayout();
        }
        else
        {
          const moveSeq = G.AutoMoveQueue[0]
          G.PendingMoves=G.PendingMoves.concat(moveSeq);
          G.PushHistory(G.GameBoard.MkLayoutCode(),
                        moveSeq[0].MkMovementCode(),
                        moveSeq[moveSeq.length-1].MkMovementCode());
          G.AutoMoveQueue.splice(0,1);
          G.MoveAnimStartTime=performance.now();
          G.MoveAnimTimer=window.setTimeout(G.AnimatePendingMoves, K.AnimTimerStep);
        }
      } // if (G.AutoMoveQueue.length>0 && G.MoveAnimTimer===-1)
    } // G.PlayAutoMoves()

    static AnimatePendingMoves()
    {
      G.MoveAnimTimer=-1;   // clear the timeout timer id.
      if (G.PendingMoves.length>0)
      {
        const moveTime = performance.now() - G.MoveAnimStartTime;
        const move0=G.PendingMoves[0];

        if (G.SoundOnQ)
        {
          if (move0.manMoveQ)
          {
            if (G.WalkSoundReadyQ && G.WalkSound.paused)
            {
              // G.WalkSound.currentTime=0;
              G.WalkSound.play();
            }
          }
          else
          {
            if (G.RoomSoundReadyQ && G.RoomSound.paused)
            {
              // G.RoomSound.currentTime=0;
              G.RoomSound.play();
            }
          }
        }

        const fracLimit=G.GameBoard.ExitMoveQ(move0) ? K.ExitAnimFracLimit : 1.0;
        let animFrac = Math.max(0, Math.min(fracLimit, moveTime/G.MoveDuration));
        // special case: animating a one step INVALID man move: reverse movement mid-way
        if (move0.manMoveQ && !G.GameBoard.ManCanMoveTowardsQ(move0.dir)) // an impossible man move.
          G.Redraw(G.PendingMoves[0], animFrac>0.5 ? (1-animFrac)/K.BadManMoveFrac : animFrac/K.BadManMoveFrac);
        else
          G.Redraw(G.PendingMoves[0], animFrac);

        if (animFrac>=fracLimit)    // reached or beyond the animated movement limit
        {
          G.CommitEarliestMove();   // commit the board changes
          G.MoveAnimStartTime=performance.now();
          if (G.SoundOnQ)
          {
            if (move0.manMoveQ)
            {
              if (G.WalkSoundReadyQ) G.WalkSound.pause();
            }
            else
            {
              if (G.RoomSoundReadyQ) G.RoomSound.pause();
            }
          }
        } // if (animFrac>=fracLimit)

        if (G.PendingMoves.length>0)
          G.MoveAnimTimer=window.setTimeout(G.AnimatePendingMoves, K.AnimTimerStep);
        else
        { // No more pending moves.
          const layoutCode=G.GameBoard.MkLayoutCode();
          let txtPfx='';
          if (G.NHistories()>1)
          {
            const prevPrevLayout = G.BoardHistory[G.BoardHistory.length-2];
            if (prevPrevLayout===layoutCode)
            {
              txtPfx="BCK TO ";
              G.PopHistory();
              G.PopHistory();
            }
          } // if (G.NHistories()>1)

          if (G.MvCountDiv)
          {
            // Update the move counter UI.
            if (G.GameBoard.exitedQ)
            {
              AddClass(G.MvCountDiv, "wonTxt");
              const nMoves = G.NHistories();
              G.MvCountDiv.innerHTML="OUT IN "+nMoves.toString();
              if (G.UnaidedQ)
              {
                const key = G.GameLevels[G.CurrLevelN].layoutKey; //K.CK_UsrMinMove + G.GameBoard.MkLayoutCode().toString(36);
                const oldrec = GetCookie(key);
                if (!oldrec || +oldrec>nMoves)
                {
                  SetCookie(key, nMoves.toString());
                  if (G.CurrLevelN>=0 && G.CurrLevelN<G.GameLevels.length)
                  {
                    G.GameLevels[G.CurrLevelN].UpdateUsrMinNMoves(nMoves);
                  }
                }
              }
            }
            else
            {
              RemoveClass(G.MvCountDiv, "wonTxt");
              G.MvCountDiv.innerHTML=txtPfx+G.NHistories().toString();
            }
          } // if (G.MvCountDiv)
          G.UpdateUI();

          if (G.AutoMoveQueue.length>0)
            G.PlayAutoMoves();
          else
          {
            G.GetNavInfoForCurrLayout();
          }
        } // if (G.PendingMoves.length>0) .. else ..(no more pending moves)
      } // if (G.PendingMoves.length>0)
    } // G.AnimatePendingMoves()

    static SolveForNav(layout:number, skipCheckQ=false)
    {
      G.NavSolverTimer=-1;
      if (skipCheckQ || layout===G.GameBoard.MkLayoutCode())  // if the board has already changed don't waste time solving for the old state.
      {
        LAvenWorker.postMessage(
          {
            'cmd':    'NavInfo',
            'layout': layout,
            'cells':  G.GameBoard.GetCellArray(),
            'manPos': G.GameBoard.GetManPos0_9(),
          }
        );
      }
    } // G.SolveForNav()

    static SetNavInfoDiv(nmoves:number)
    {
      if (G.NavOnQ && G.NavInfoDiv)
      {
        if (nmoves===undefined || nmoves<=0)
        {
          G.NavInfoDiv.innerHTML='<span style="font-size:18px;">(+_+)</span>';
          G.NavInfoDiv.className='ProxBad';
        }
        else
        {
          G.NavInfoDiv.innerHTML=nmoves.toString();
          G.NavInfoDiv.className='Prox'+(nmoves<10 ? 4 : nmoves<15 ? 3 : nmoves<20 ? 2 : nmoves<30 ? 1 : 0);
        }
      }
    } // G.SetNavInfoDiv()

    static FillNavInfo(layout:number, nmoves:number)
    {
      G.NavInfo[layout]=nmoves;
      if (G.GameBoard.MkLayoutCode()===layout)
        G.SetNavInfoDiv(nmoves);
    } // G.FillNavInfo()

    static GetNavInfoForCurrLayout()
    {
      if (G.NavOnQ && G.NavInfoDiv)
      {
        let navData:number=0;
        let currLayout=0;
        if (!G.GameBoard.exitedQ)
        {
          currLayout = G.GameBoard.MkLayoutCode();
          navData = G.NavInfo[currLayout];
        }
        G.SetNavInfoDiv(navData);
        if (navData!==undefined)
        {
          if (G.NavSolverTimer!==-1)
          {
            clearTimeout(G.NavSolverTimer);
            G.NavSolverTimer=-1;
          }
        }
        else if (G.NavSolverTimer===-1)
        {
          G.NavSolverTimer=setTimeout(()=>{G.SolveForNav(currLayout);}, K.NavSolveDelay);
        }
      }
    } // G.GetNavInfoForCurrLayout()

    static StartManDragX=-1;
    static StartManDragY=-1;
    static LastDragX=-1;
    static LastDragY=-1;
    static StartManCoord:Coord=null;
    static ComboMoveCells:Coord[]=[]; // start with the X cell.
    //---------------------------------------------------------------------
    //   __  __              ____     __                   __  _
    //  / / / /__ ___ ____  /  _/__  / /____ _______ _____/ /_(_)__  ___
    // / /_/ (_-</ -_) __/ _/ // _ \/ __/ -_) __/ _ `/ __/ __/ / _ \/ _ \
    // \____/___/\__/_/   /___/_//_/\__/\__/_/  \_,_/\__/\__/_/\___/_//_/
    //
    //
    //  PointerDown and KeyDown handlers
    //
    //--------------------------------------------------------------------
    static OnPointerDown(e: Event)
    {
      if (G.PickingLevelQ)
      {
        G.ShowHideLevelPicker(false);
        return;
      }
      else if (G.ShowingAboutBoxQ)
      {
        G.ShowHideAboutBox(false);
      }

      let mouseQ=true;
      if (e instanceof PointerEvent && (e.pointerType==="touch" || e.pointerType==="pen"))
        mouseQ=false;

      G.StartManDragX=-1;
      G.StartManDragY=-1;
      G.LastDragX=-1;
      G.LastDragY=-1;
      G.StartManCoord=null;
      G.ValidManDragDirs=null;
      if (!G.GameBoard.exitedQ && !G.BFSSolvingQ && !G.PickingLevelQ)
      {
        const bdr = G.Canv.getBoundingClientRect();
        const cLeft=bdr.left;

        const scrollTop = ((document.documentElement.clientHeight) ? document.documentElement : document.body).scrollTop;
        const cTop=bdr.top+scrollTop; //document.body.scrollTop;
          // these are in css px units from event.
        const posX = (<MouseEvent>e).pageX-cLeft;  // convert into canvas offsets.
        const posY = (<MouseEvent>e).pageY-cTop;
        const scl = G.CanvasResScale;
        const cvX=posX*scl, cvY=posY*scl;   // scaled by CanvasResScale;

        const hit = G.GameBoard.HitTest(G.Canv.width, G.Canv.height, cvX, cvY);

        if (hit)
        {
          if (G.AutoMoveQueue.length>0)   // interrupt the sequence of auto moves.
          {
            G.InterruptAutoMovesQ=true;
          }
          else if (G.PendingMoves.length===0)  // don't introduce new moves when a pending move is still animating.
          {
            if (G.GameBoard.ManInCellQ(hit.cellPos))
            {
              // Clicked on a room cell without the man.
              G.ValidManDragDirs=[];
              for (let dir=0; dir<4; dir++)
              {
                if (G.GameBoard.manCell.Connector(dir)!==0) //G.GameBoard.ManCanMoveTowardsQ(dir, hit.cellPos))
                {
                  G.ValidManDragDirs.push(dir);
                }
              } // for (dir)

              // 2023-02-26 Do not do anything immediately. Always wait until Drag or Up
              // Start dragging
              G.StartManDragX=posX;
              G.StartManDragY=posY;
              G.StartManCoord= hit.cellPos;
              G.Canv.style.cursor='pointer';
            }
            else if (hit.cellPos.x>=0 && hit.cellPos.x<3 && hit.cellPos.y>=0 && hit.cellPos.y<3)
            { // man is not in the cell. A potential room shift click.
              if (G.GameBoard.NoRoomQ(hit.cellPos.x, hit.cellPos.y))
              {
                // Clicked on the empty slot. Start dragging and collecting ComboMoveCells[].
                G.LastDragX=posX;
                G.LastDragY=posY;
                G.ComboMoveCells[0]=hit.cellPos;
                G.Canv.style.cursor='pointer';
              }
              else if (!G.AppendMoves(hit.cellPos, -1)) // try to move the clicked room.
              {
                // Clicked on an inmovable room. Check if the man can be moved here.
                const manDir = G.GameBoard.ManCanReach(hit.cellPos);
                if (manDir>=0 && manDir<4)
                {
                  G.AppendMoves(G.GameBoard.ManPos, manDir);
                }
              }
            }
          } // if (G.PendingMoves.length===0)
        } // if (hit)
      } // if (.. can accept pointer actions)
    } // G.OnPointerDown() //

    static OnPointerMove(e:Event)
    {
      const bdr = G.Canv.getBoundingClientRect();
      const cLeft=bdr.left;

      const scrollTop = ((document.documentElement.clientHeight) ? document.documentElement : document.body).scrollTop;
      const cTop=bdr.top+scrollTop; //document.body.scrollTop;

      const posX = (<MouseEvent>e).pageX-cLeft;  // convert into canvas offsets.
      const posY = (<MouseEvent>e).pageY-cTop;

      if (G.StartManDragX>=0 && G.StartManDragY>=0 && G.PendingMoves.length===0 && G.StartManCoord!==null)
      {
        function _validDragDirQ(dir:number)
        {
          for (let i=0; i<G.ValidManDragDirs.length; i++)
            if (G.ValidManDragDirs[i]===dir) return true;
          return false;
        } // _validDragDirQ()

        let dx=posX-G.StartManDragX;
        let dy=posY-G.StartManDragY;
        const xDragDir = dx>K.MinDragLength ? 1 : dx< -K.MinDragLength ? 3 : -1;
        const yDragDir = dy>K.MinDragLength ? 2 : dy< -K.MinDragLength ? 0 : -1;
        if (xDragDir>=0 || yDragDir>=0)
        {
          let nDragDirs=0;
          let dragDir=-1;
          if (_validDragDirQ(xDragDir)) {
            nDragDirs++; dragDir=xDragDir;
          }
          if (_validDragDirQ(yDragDir)) {
            nDragDirs++; dragDir=yDragDir;
          }

          let moveDir=-1;
          if (nDragDirs===1) {  // no ambiguity
            moveDir=dragDir;
          }
          // else if (Math.abs(Math.abs(dx)-Math.abs(dy))>5) {  // enough difference to distinguish between vert and horz drag.
          //   if (Math.abs(dx)>Math.abs(dy)) moveDir=xDragDir;
          //   else moveDir=yDragDir;
          // }

          if (moveDir>=0)
          {
            G.AppendMoves(G.StartManCoord, moveDir);
            G.StartManDragX=G.StartManDragY=-1;
            G.StartManCoord=null;
            G.Canv.style.cursor='auto';
          }
        }
      } // clicked on man piece and no pending movement
      else if (G.ComboMoveCells.length>0 && G.LastDragX>=0 && G.LastDragY>=0)
      { // clicked on the X cell, continue to check for macro move gesture.
        const scl = G.CanvasResScale;
        const cvX=posX*scl, cvY=posY*scl;   // scaled by CanvasResScale;

        let dx=posX-G.LastDragX;
        let dy=posY-G.LastDragY;
        if (Math.abs(dx)>K.DragStepDiff || Math.abs(dy)>K.DragStepDiff)
        {
          G.LastDragX=posX;
          G.LastDragY=posY;
          const hit = G.GameBoard.HitTest(G.Canv.width, G.Canv.height, cvX, cvY);
          if (hit
          && !G.GameBoard.ManInCellQ(hit.cellPos.x, hit.cellPos.y)) // give up immediate if we are dragging through a man occupied (i.e. immovable) cell.
          {
            const hitcell=hit.cellPos;
            const dcells=G.ComboMoveCells;
            const ndcells=G.ComboMoveCells.length;
            if (!hitcell.eq(dcells[ndcells-1]))
            {
              const backToCell0Q = hitcell.eq(dcells[0]);
              if (backToCell0Q)  // check if we have formed a circum-gesture.
              {
                G.__CheckComboRoomSwapGesture();
                G.ComboMoveCells=[]; // done with collecting dragged-through cells.

                if (G.AutoMoveQueue.length>0)   // if auto moves have been generated, play them.
                {
                  G.InterruptAutoMovesQ=false;
                  G.PlayAutoMoves();
                }
              }
              else
              { // collect this newly entered cell
                dcells.push(hit.cellPos);
              }
            }
          }
          else
          {
            G.ComboMoveCells=[];
          }
        }

        if (G.ComboMoveCells.length===0)
          G.Canv.style.cursor='auto';
      } // MacroDragCells.length>0
    } // G.OnPointerMove()

    static OnPointerUp(e:Event)
    {
      if (G.StartManDragX>=0 && G.StartManDragY>=0 && G.PendingMoves.length===0 && G.StartManCoord!==null)
      {
        const bdr = G.Canv.getBoundingClientRect();
        const cLeft=bdr.left;

        const scrollTop = ((document.documentElement.clientHeight) ? document.documentElement : document.body).scrollTop;
        const cTop=bdr.top+scrollTop; //document.body.scrollTop;

        const posX = (<MouseEvent>e).pageX-cLeft;  // convert into canvas offsets.
        const posY = (<MouseEvent>e).pageY-cTop;
        let dx=posX-G.StartManDragX;
        let dy=posY-G.StartManDragY;
        if (Math.abs(dx)<K.MinDragLength && Math.abs(dy)<K.MinDragLength)
        {
          const scl = G.CanvasResScale;
          const cvX=G.StartManDragX*scl, cvY=G.StartManDragY*scl;   // scaled by CanvasResScale;

          const hit = G.GameBoard.HitTest(G.Canv.width, G.Canv.height, cvX, cvY);

          if (hit && !hit.onManQ)
          {
            // an off-centered directional click?
            if (hit.offCtrDir>=0) G.AppendMoves(hit.cellPos, hit.offCtrDir);
          }
        }
      }
      else if (G.ComboMoveCells.length>=4) // check if it has formed a circum gesture cycle.
      {
        G.__CheckComboRoomSwapGesture();
      }
      G.StartManDragX=G.StartManDragY=-1;
      G.StartManCoord=null;
      G.ValidManDragDirs=null;
      G.ComboMoveCells=[];
      G.Canv.style.cursor='auto';

      if (G.AutoMoveQueue.length>0)   // if auto moves have been generated, play them.
      {
        G.InterruptAutoMovesQ=false;
        G.PlayAutoMoves();
      }
    } // G.OnPointerUp()

    static __CheckComboRoomSwapGesture() : boolean
    {
      let gestureDetectedQ=false;
      const dcells=G.ComboMoveCells;
      const ndcells=dcells.length;
      if (ndcells>=4)
      {
        const cell0=dcells[0];
        let d0 = cell0.dirFrom(dcells[ndcells-1]);
        let d1 = dcells[ndcells-1].dirFrom(dcells[ndcells-2]);
        if (d0>=0 && d1>=0)
        {
          let sign = d1-d0;             // direction change, signed.
          if (sign===3) sign=-1;        // wrapped around
          else if (sign===-3) sign=1;   //  .. ..

          if (Math.abs(sign)<2) // sign===0 || sign===1 || sign===-1)
          {
            d0=d1;
            for (let i=ndcells-2; i>0; i--)
            {
              d1 = dcells[i].dirFrom(dcells[i-1]);
              if (d1<0)  // not adjacent
              {
                sign=9; break;
              }
              else
              {
                let s=d1-d0;
                if (s===3) s=-1;
                else if (s===-3) s=1;
                if (s*sign!==0 && s!==sign)
                {
                  sign=9; break;
                }
                else if (s!==0) sign=s;
                d0=d1;
              }
            } // for (i)

            if (Math.abs(sign)===1)
            {
              // console.log("sign="+sign+" ndcells="+ndcells);
              G.AutoMoveQueue = [];
              const moves = G.AutoMoveQueue;

              moves.push([new Movement(cell0.dirFrom(dcells[ndcells-1]), dcells[ndcells-1])]);
              for (let i=ndcells-2; i>=0; i--)
              {
                moves.push([new Movement(dcells[i+1].dirFrom(dcells[i]), dcells[i])]);
              }
              // console.log((sign===1 ? "CCW " : "CW ") + "cycle formed.");
              gestureDetectedQ=true;
            }
          }
        } // if (d0>=0 && d1>=0)
      } // if (ndcells>=4) ... //
      return gestureDetectedQ;
    } // G.__CheckComboRoomSwapGesture()

    static OnKeyDown(ev: Event)
    {
      const e=ev as KeyboardEvent;
      if (G.GameBoard && !G.GameBoard.exitedQ && !G.BFSSolvingQ && !G.PickingLevelQ && !G.ShowingAboutBoxQ
      && G.PendingMoves.length===0
      && (G.StartManDragX<0 || G.StartManDragY<0 || G.StartManCoord===null))
      {
        if (e.isComposing || e.keyCode===229) return;
        let manMoveDir=-1;
        switch (e.key)
        {
        case 'Left':  case 'ArrowLeft':
          manMoveDir=3;
          break;
        case 'Right': case 'ArrowRight':
          manMoveDir=1;
          break;
        case 'Up':    case 'ArrowUp':
          manMoveDir=0;
          break;
        case 'Down':  case 'ArrowDown':
          manMoveDir=2;
          break;
        case 'z':
          if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey && G.NHistories()>0)
          {
            G.UserCommand('undo');
          }
        } // switch (e.key)

        if (manMoveDir>=0 && manMoveDir<4)
          G.AppendMoves(null, manMoveDir);
      }
      else if (G.PickingLevelQ || G.ShowingAboutBoxQ)
      {
        if (e.key==='Escape' || e.key==='Esc')
        {
          if (G.PickingLevelQ)
            G.ShowHideLevelPicker(false);
          if (G.ShowingAboutBoxQ)
            G.ShowHideAboutBox(false);
        }
      }
      else if (G.AutoMoveQueue.length>0)
      {
        if (e.key.match(/^(Arrow|Left|Right|Up|Down|Esc|Space|Enter|Return| ).*/i))
          G.InterruptAutoMovesQ=true;
      }
    } // G.OnKeyDown()

    static __onSoundReady(s:number)
    {
      if (s===1) G.WalkSoundReadyQ=true;
      else if (s===2) G.RoomSoundReadyQ=true;
    } // G.__onSoundReady()

    static ToggleSound()
    {
      if (G.SoundOnQ)
        G.SoundOnQ=false;
      else
      {
        if (G.WalkSound===null || G.RoomSound===null)
        {
          G.WalkSound = new Audio('rsrc/ManRun.mp3');
          G.WalkSound.addEventListener('canplaythrough', ()=>{G.__onSoundReady(1)});
          G.RoomSound = new Audio('rsrc/TileSlide.mp3');
          G.RoomSound.addEventListener('canplaythrough', ()=>{G.__onSoundReady(2)});
        }
        G.SoundOnQ=true;
      }
    } // G.ToggleSound()

    static ResizeTimer=-1;
    static OnResize()
    {
      if (G.ResizeTimer!==-1)
        window.clearTimeout(G.ResizeTimer);
      G.ResizeTimer = window.setTimeout(G.__actualResize, K.ResizeDebounceDelay);
    } // G.OnResize()

    static __actualResize()
    {
      const vh = window.innerHeight;
      document.documentElement.style.setProperty('--vh', (vh/100).toFixed(2)+'px');

      if (G.Canv && G.MazeDiv && G.BtnsDiv) {
        const vw = window.innerWidth;
        let w=vw;
        let h=vh;
        if (vw-vh>0/*120*/) {  // switch to landscape mode
          G.BtnsDiv.style.width="120px";
          G.BtnsDiv.style.height=vh.toString()+"px";
          G.MazeDiv.style.left="120px";
          G.MazeDiv.style.top="0px";
          G.MazeDiv.style.width=(vw-150).toString()+"px";
          G.MazeDiv.style.height=vh.toString()+"px";
          w=vw-120;
        }
        else {
          G.BtnsDiv.style.width=vw.toString()+"px";
          G.BtnsDiv.style.height="40px";
          G.MazeDiv.style.left="0px";
          G.MazeDiv.style.top="40px";
          G.MazeDiv.style.width=vw.toString()+"px";
          G.MazeDiv.style.height=(vh-40).toString()+"px";
          h=vh-40;
        }
        const scl=G.CanvasResScale;
        const cw = Math.floor(w*scl);
        const ch = Math.floor(h*scl);
        G.Canv.width  = cw;
        G.Canv.height = ch;
        G.Canv.style.width = w.toString()+"px";
        G.Canv.style.height= h.toString()+"px";

        G.Redraw();
      }
    } // G.OnResize()

    static UpdateUI()
    {
      if (G.UndoBtn)
      {
        G.UndoBtn.disabled = ((G.PendingMoves && G.PendingMoves.length>1) || G.BoardHistory.length===0);
      }
      if (G.RestartBtn)
      {
        const notStartedQ = G.CurrLevel && G.GameBoard && G.NHistories()===0;
        G.RestartBtn.disabled = notStartedQ;
      }
      if (G.NavBtn)
      {
        G.NavBtn.firstChild.textContent= G.NavOnQ ? K.NavOnTxt : K.NavOffTxt;
      }
      if (G.NavInfoDiv)
      {
        G.NavInfoDiv.hidden = !G.NavOnQ;
        const nmoves = G.GameBoard.exitedQ ? 0 : G.NavInfo[G.GameBoard.MkLayoutCode()];
        G.SetNavInfoDiv(nmoves);
      }
      if (G.SoundOnOffBtn)
      {
        G.SoundOnOffBtn.disabled=false;
        G.SoundOnOffBtn.textContent=G.SoundOnQ ? K.SoundOnTxt : K.SoundOffTxt;
      }
    } // G.UpdateUI()

    static updateMaxHeight()
    {
      let inps = document.getElementsByName("expandBox");
      for (let i=0; i<inps.length; i++) {
        if (inps[i] && inps[i] instanceof HTMLInputElement) {
          const chkbox = inps[i] as HTMLInputElement;
          const content = inps[i].nextElementSibling.nextElementSibling as HTMLDivElement;
          if (content && content instanceof HTMLElement && content.className==="content") {
            content.style.maxHeight = chkbox.checked ? content.scrollHeight+"px" : "0px";
          }
        }
      }
    }

    static OnExpandBoxClick(e:Event)
    {
      if (e && e.target instanceof HTMLInputElement) {
        let tgt = e.target;
        if (tgt.checked) {
          let inps = document.getElementsByName("expandBox");
          for (let i=0; i<inps.length; i++) {
            const inputi = inps[i] as HTMLInputElement;
            if (inputi!==tgt && inputi instanceof HTMLInputElement && inputi.type==="checkbox") {
              inputi.checked=false;
            }
          }
        }
        G.updateMaxHeight();
        tgt.scrollIntoView();
      }
    } // G.OnExpandBoxClick




    static SetupBoard(layout:GameLevel)
    {
      G.CurrLevel = layout;
      G.GameBoard = new Board(layout);
      // layout.SetupBoard(G.GameBoard);
      G.MoveHistory=[];
      G.BoardHistory=[];
      if (G.MvCountDiv)
      {
        RemoveClass(G.MvCountDiv, "wonTxt");
        G.MvCountDiv.innerHTML="0";
      }
      G.Redraw();
      G.UpdateUI();
    } // G.SetupBoard()

    static _commitAllPendingMoves()
    {
      if (G.MoveAnimTimer!==-1)
      {
        window.clearTimeout(G.MoveAnimTimer);
        G.MoveAnimTimer=-1;
      }
      for (let i=0; i<G.PendingMoves.length; i++)
      {
        G.GameBoard.CommitMove(G.PendingMoves[i]);
      } // for (i)
      G.PendingMoves=[];
    } // G._commitAllPendingMoves

    static StartLevel(level=-1) // -1 means current level
    {
      if (level<0) level=G.CurrLevelN;
      if (level<0 || level>=G.GameLevels.length) level=0;

      G._commitAllPendingMoves();
      G.AutoMoveQueue=[];
      G.CurrLevelN=level;
      G.CurrLevel = G.GameLevels[level];
      G.SetupBoard(G.CurrLevel);
      G.UnaidedQ=true;  // robot has not been used yet.
      G.NavInfo=[];
      if (G.CurrLevel.minNMoves>0)
      {
        G.NavInfo[G.GameBoard.MkLayoutCode()]=G.CurrLevel.minNMoves;
      }
      G.UpdateUI();
      // G.GameBoard = new Board(G.CurrLevel);
    } // G.StartLevel()

    //-----------------------------------------------------------------
    //  UserCommand() : menu/button commands processing.
    //-----------------------------------------------------------------
    static UserCommand(cmd:string)
    {
      if (G.PickingLevelQ)
        G.ShowHideLevelPicker(false);
      else if (G.ShowingAboutBoxQ)
        G.ShowHideAboutBox(false);
      else
      {
        if (G.AutoMoveQueue.length>0) { G.InterruptAutoMovesQ=true; }

        if (G.PendingMoves.length===0)
        {
          switch (cmd)
          {
          case 'soundOnOff':
            G.ToggleSound();
            break;
          case 'showAbtBox':
            G.ShowHideAboutBox(true);
            break;
          case 'closeAbtBox':
            G.ShowHideAboutBox(false);
          case 'restart':
            G.StartLevel();
            break;
          case 'pickLevel':
            G.ShowHideLevelPicker(true);
            break;
          case 'closeLvlPicker':
            G.ShowHideLevelPicker(false);
            break;
          case 'navToggle':
            G.NavOnQ=!G.NavOnQ;
            if (G.NavOnQ)
            {
              if (G.PendingMoves.length===0 && G.PrepingLevelN>=G.GameLevels.length && !G.BFSSolvingQ)  // PrepingLevelN>=...length means level solves done.
                G.SolveForNav(G.GameBoard.MkLayoutCode(), true);
            }
            else
            {
              if (G.NavSolverTimer!==-1)
              {
                clearTimeout(G.NavSolverTimer);
                G.NavSolverTimer=-1;
              }
            }
            G.UpdateUI();
            break;
          case 'autoSolve':
            if (G.WasmSolverReadyQ && G.GameBoard && !G.GameBoard.exitedQ && G.PendingMoves.length===0 && !G.BFSSolvingQ)
            {
              G._commitAllPendingMoves();
              G.BFSSolvingQ=true;

              LAvenWorker.postMessage(
              {
                'cmd':    'Solve',
                'layout': G.GameBoard.MkLayoutCode(),
                'cells':  G.GameBoard.GetCellArray(),
                'manPos': G.GameBoard.GetManPos0_9(),
                // cells:[0,9,1,7,7,13,2,3,12],
                // manPos: 6,
              });

              G.UnaidedQ=false;
            }
            break;
          case 'undo':
            if (G.PendingMoves.length===0 && !G.BFSSolvingQ && G.NHistories()>0)
            {
              const hist=G.PopHistory();
              let result:{moves:Movement[]|null, noEffectQ:boolean};
              if (hist.finalMove<8) // man move
              {
                const dir = ((hist.finalMove&3)+2)%4;
                result = G.GameBoard.GenManMovements(dir);
              }
              else  // room shift
              {
                const oldXPos = Board.getXPos(hist.config);
                result = G.GameBoard.GenMovement(new Coord(oldXPos%3, Math.floor(oldXPos/3)));
              }

              if (result && !result.noEffectQ && result.moves!==null && result.moves.length>0)
              {
                for (let i=0; i<result.moves.length; i++) result.moves[i].SetUndoingFlag();
                G.PendingMoves = G.PendingMoves.concat(result.moves);
                if (G.PendingMoves.length>0 && G.MoveAnimTimer===-1) {
                  G.MoveAnimStartTime=performance.now();
                  G.MoveAnimTimer=window.setTimeout(G.AnimatePendingMoves, K.AnimTimerStep);
                }
              }
            }
            break;
          } // switch (cmd)
          G.UpdateUI();
        } // if (PendingMoves.length===0)
      }
    } // G.UserCommand()


    static OnWorkerMessage(e : MessageEvent)
    {
      if (e && e.data)
      {
        const msg = e.data as WorkerMsg;
        switch (msg['type'])
        {
        case 'Solution':
          console.log(msg['nmoves'].toString()+" moves solve.");
          if (G.SpinnerDiv) G.SpinnerDiv.hidden=true;
          switch (msg['cmd'])
          {
          case 'Solve':
            G.AutoMove(msg['nmoves'], msg['moves']);
            break;
          case 'LvlPrep':
            G.SetGameLevelSolution(msg['layout'], msg['nmoves']);
            break;
          case 'NavInfo':
            G.FillNavInfo(msg['layout'], msg['nmoves']);
            break;
          } // switch (msg.cmd)
          G.BFSSolvingQ=false;
          break;
        case 'Progress':
          if (G.SpinnerDiv) G.SpinnerDiv.hidden=false;
          break;
        case 'WasmReady':
          console.log("Wasm Ready.");
          G.WasmSolverReadyQ=true;
          G.PrepGameLevels();
          break;
        } // switch (e.type)
      }
      G.UpdateUI();
    } // OnWorkerMessage()

    //----------------------------------------------------------
    //     ____     _ __  ___
    //    /  _/__  (_) /_/ _ \___ ____ ____
    //   _/ // _ \/ / __/ ___/ _ `/ _ `/ -_)
    //  /___/_//_/_/\__/_/   \_,_/\_, /\__/
    //                           /___/
    //----------------------------------------------------------
    static InitPage()
    {
      function _setupBtn(id:string, cmd:string)
      {
        let btn=byId(id) as HTMLButtonElement;
        if (btn) btn.onclick=(e:Event)=>{
          e.stopPropagation();
          G.UserCommand(cmd);
        }
        return btn;
      }
      G.RestartBtn=_setupBtn('restartBtn', 'restart');
      _setupBtn('pickLvlBtn', 'pickLevel');
      _setupBtn('revealBtn', 'autoSolve');
      _setupBtn('helpBtn', 'showAbtBox');
      G.UndoBtn=_setupBtn('undoBtn', 'undo');
      _setupBtn('closeLvlPicker', 'closeLvlPicker');
      G.NavBtn = _setupBtn('navBtn', 'navToggle');
      _setupBtn('closeAbtBox', 'closeAbtBox');
      G.SoundOnOffBtn = _setupBtn('soundOnOffBtn', 'soundOnOff');


      G.AboutBoxDiv = byId('aboutBoxDiv') as HTMLDivElement;
      G.MazeDiv = byId('mazeDiv') as HTMLDivElement;
      G.BtnsDiv = byId('btnDiv') as HTMLDivElement;
      G.MvCountDiv = byId('moveCount') as HTMLDivElement;
      G.Canv = byId("gfxCanv") as HTMLCanvasElement;
      G.Canv.style.backgroundColor="#fff";
      G.SpinnerDiv = byId('spinner') as HTMLDivElement;
      G.LevelPickerDiv = byId('lvlPicker') as HTMLDivElement;
      G.NavInfoDiv=byId('navInfo') as HTMLDivElement;

      // STARTER
      G.GameLevels.push(new GameLevel('═┐x╔←┘╚←┐', 1,2)); // LVL 1
      G.GameLevels.push(new GameLevel('╗↓└╚═←x└┐', 1,0)); // LVL 2
      G.GameLevels.push(new GameLevel('┐↑╝╚←┘x║└', 1,0)); // LVL 3
      G.GameLevels.push(new GameLevel('↑╔←╚└┐═┘x', 1,1)); // LVL 4
      // G.GameLevels.push(new GameLevel('╔═╗↑x↑└┘└', 2,2)); // LVL 5
      // G.GameLevels.push(new GameLevel('┐┌→←└x╗╝║', 2,0)); // LVL 6
      // G.GameLevels.push(new GameLevel('╗╔═↑┌x↑└┘', 2,2)); // LVL 7
      G.GameLevels.push(new GameLevel('←┌→x═╔┌┘╗', 2,0)); // LVL 8 -> 5
      // G.GameLevels.push(new GameLevel('←┌→═└┘╔╚x', 2,1)); // LVL 9
      // G.GameLevels.push(new GameLevel('═╚╗┌→←└┐x', 1,2)); // LVL 10
      G.GameLevels.push(new GameLevel('←┐║←╗x└┘╔', 1,2)); // LVL 11 -> 6
      // G.GameLevels.push(new GameLevel('╔═←╚x┐↓┌┘', 2,2)); // LVL 12
      // JUNIOR
      // G.GameLevels.push(new GameLevel('╔╗x↑↑║└┘└', 0,1)); // LVL 13
      // G.GameLevels.push(new GameLevel('╚╗x→←┐═└┘', 1,2)); // LVL 14
      G.GameLevels.push(new GameLevel('└┌x╔→═↑╗┘', 1,1)); // LVL 16 -> 7
      // G.GameLevels.push(new GameLevel('║╗x╚┌→←└┐', 2,1)); // LVL 19
      // G.GameLevels.push(new GameLevel('┘╗┌↓x└╚═←', 2,0)); // LVL 22

      // EXPERT
      G.GameLevels.push(new GameLevel('→╗┐║x┐┐╚←', 0,0)); // LVL 39 -> 8
      G.GameLevels.push(new GameLevel('x┌╗←└┐║╚→', 1,0)); // LVL 25 -> 9
      // G.GameLevels.push(new GameLevel('║↑╗┌┐┌x↓╚', 1,2)); // LVL 27
      // G.GameLevels.push(new GameLevel('┌┐║x┐↓╚←╝', 0,0)); // LVL 29
      G.GameLevels.push(new GameLevel('║╗╔┌↑x←┘┌', 1,2)); // LVL 31 -> 10
      // G.GameLevels.push(new GameLevel('═←╗┌┘x╚→└', 0,1)); // LVL 33
      // G.GameLevels.push(new GameLevel('╚┐↑═┌┐╗x↓', 1,1)); // LVL 35
      // // MASTER
      // G.GameLevels.push(new GameLevel('┌→←╗x┘╚└║', 1,2)); // LVL 37
      // G.GameLevels.push(new GameLevel('┌→←╗x┘╚└║', 2,0)); // LVL 38

      // G.GameLevels.push(new GameLevel('x┘←┐╔═┘↑╚', 1,2)); // LVL 40
      // G.GameLevels.push(new GameLevel('┌┘x╔═╝↑←└', 0,2)); // LVL 41
      // G.GameLevels.push(new GameLevel('║┌╗←┘x└╚→', 0,1)); // LVL 42
      // G.GameLevels.push(new GameLevel('x╗┌└╝┘→═←', 2,2)); // LVL 43
      // G.GameLevels.push(new GameLevel('→╗x┌╚←═└┘', 2,2)); // LVL 44
      // G.GameLevels.push(new GameLevel('┘└═x╔←→╝┌', 2,1)); // LVL 45
      G.GameLevels.push(new GameLevel('╗↑└╚x→└═┐', 1,0)); // LVL 50X

      G.GameLevels.push(new GameLevel('x╝┘→→═└┌╗', 0,2)); // LVL 49X

      // G.GameLevels.push(new GameLevel('╔┘┐╚═←x←┐', 2,1));
      // G.GameLevels.push(new GameLevel('╗↑└╚x→└═┐', 1,0)); // LVL 50X

      // const layout = new GameLevel('╗↓└╚x←└═┐',1,0);
      // const layout = new GameLevel('╗↑└╚x→└═┐',1,0);  // LVL 50X (55 moves)
      // const layout = new GameLevel('═←┐╔x┘╚←┐', 1,2); // LVL 1
      // const layout = new GameLevel('x╝┘→→═└┌╗', 0,2); // LVL 49X
      // const layout = new GameLevel('╔┘┐╚═←x←┐', 2,1);

      const lvlsaved=GetCookie("LAvenLvl");
      const gameLvl = (lvlsaved && +lvlsaved>=0 && +lvlsaved<G.GameLevels.length) ?
        +lvlsaved : 0;

      G.StartLevel(gameLvl);
      // G.CurrLevel = G.GameLevels[G.CurrLevelN];
      // G.GameBoard = new Board(G.CurrLevel);
      // G.GameBoard = new Board('═←┐╔x┘╚←┐', 1,2);
      // G.GameBoard = new Board('╔┘┐╚═←x←┐', 2,1);

      Cell.LoadImages();
      Board.LoadImages();

      // Setup the Expand box click handler in the collapsible about box.
      let inps = document.getElementsByName("expandBox");
      for (let i=0; i<inps.length; i++)
      {
        if (inps[i] instanceof HTMLInputElement)
        {
          const input=inps[i] as HTMLInputElement;
          if (input.type==="checkbox")
          {
            input.addEventListener("click", G.OnExpandBoxClick);
            input.checked=false;
          }
        }
      } // for (i)
      G.updateMaxHeight();

      window.onkeydown = G.OnKeyDown;
      window.onresize = G.OnResize;
      G.Canv.style.touchAction="none";
      G.Canv['onpointerdown'] = G.OnPointerDown;
      document['onpointermove'] = G.OnPointerMove;
      document['onpointerup'] = G.OnPointerUp;
      G.BtnsDiv.onclick=()=>{
        if (G.PickingLevelQ) G.ShowHideLevelPicker(false);
        if (G.ShowingAboutBoxQ) G.ShowHideAboutBox(false);
      };
      G.__actualResize();
      G.UpdateUI();

    } // G.InitPage()
  } // class G

  let LAvenWorker = new Worker('lavenworker.js');
  LAvenWorker.onerror = (e:ErrorEvent)=>{  console.log(e); };
  LAvenWorker.addEventListener('message', G.OnWorkerMessage);

  interface Window {[key:string]:any}
  window["initPage"]=G.InitPage;
