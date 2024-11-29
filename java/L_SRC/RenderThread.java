// Name RUFIN H
// Date 15 Jan 2023
// Description Drawing handlers for the game.

import java.awt.*;
import javax.swing.*;
import java.io.*;
import javax.imageio.*;
import java.awt.image.BufferedImage;

class RenderThread extends JPanel implements Runnable
{
  private static final int TILE_NORMAL = 0, TILE_SIMPLE = 1, TILE_TOP = 2;
  // current tile-slide animation
  private Movement currA;
  private long animStartT;
  // frame is passed in
  private static JFrame frame;
  // animation time in ms/action
  public static int animTime;
  private static final int FPS = 60;
  // y-offset of the player when it goes onto the second floor
  private static final int secondFOffset = 30;
  // animation flags for the player and the tile
  public static boolean pAnim, tAnim;
  // current position of the player (in animation)
  private Coord currPos;
  // current direction
  public int currDir;
  // images are loaded before any animation takes place
  private static BufferedImage[] imgs;
  private static BufferedImage boardI, bottomI, playerI, brdShadow;

  private static BufferedImage[] imgs2;
  private static BufferedImage boardI2, bottomI2, playerI2; // pure top-view assets

  private static BufferedImage[] imgs3;

  // simple or realistic tile-images?
  public static boolean simpleLayoutQ = false;

  // updated every time the window is resized
  private static int boardSz, left, top;
  private static double scl;

  /**
   * Initialises the DrawHandler, loads all images and draws the board starting position given a frame.
   */
  RenderThread(JFrame f)
  {
    frame = f;
    animTime = 250;
    reset();
    loadImgs();
  } // constructor

  /**
   * Updates the animation time given a new time @param time.
   */
  public static void updateAT(int time) {animTime = time;}

  /**
   * Resets the DrawHandler animation information and calls for audio (handled by the LUI) to be reset.
   */
  public void reset() {
    currPos = new Coord(Board.playerPos.x, Board.playerPos.y);
    currDir = -1;
    animStartT = -1;
    currA = new Movement(0, 0, 0, 0, 0);
    tAnim = false;
    pAnim = false;
    repaint();
    LUI.resetAudio();
    // image loading not required
  }

  /**
   * Call-back for LAnim to input a new TileSlideInfo @param info for tile-sliding.
   * NOT ERROR-CHECKED - CHECK BEFORE CALLING!
   */
  public void pushSlide(Movement info) {
    currA = info;
    tAnim = true;
  } // pushAnim()

  /**
   * Call-back for LAnim to input a new dir @param info for player movement animation
   * NOT ERROR-CHECKED - CHECK BEFORE CALLING!
   */
  public void pushMove(int dir) {
    currDir = dir;
    pAnim = true;
  } // pushAnim()


  /**
   * Loads all images for the simple and realistic layouts.
   * CALL BEFORE STARTING ANIMATION - IMAGES WILL NOT LOAD OTHERWISE!
   */
  private static void loadImgs()
  {
    try {
      imgs = new BufferedImage[15];
      imgs2 = new BufferedImage[15];
      imgs3 = new BufferedImage[15];
      for (int i=1; i<imgs.length; i++) {
        imgs[i] = ImageIO.read(new File("L_RSRC/Tile"+i+".png"));
        imgs2[i]= ImageIO.read(new File("L_RSRC/Tile"+i+"B.png"));
        try {imgs3[i]= ImageIO.read(new File("L_RSRC/Tile"+i+"C.png"));} catch (Exception e) {imgs3[i] = imgs[i];}
        // else imgs[i] = ImageIO.read(new File("L_RSRC/Tile"+i+".jpg"));
      }
      boardI = ImageIO.read(new File("L_RSRC/Board.png"));
      bottomI = ImageIO.read(new File("L_RSRC/BoardBot.png"));
      playerI = ImageIO.read(new File("L_RSRC/Player.png"));
      boardI2 = ImageIO.read(new File("L_RSRC/BoardB.png"));
      bottomI2 = ImageIO.read(new File("L_RSRC/BoardBotB.png"));
      playerI2 = ImageIO.read(new File("L_RSRC/PlayerB.png"));
      brdShadow = ImageIO.read(new File("L_RSRC/BRDSHD-shdw.png"));
    } catch (Exception e) {
      // Image(s) not found!
      e.printStackTrace();
    }
  } // loadimgs

  /**
   * This method is threaded and can run continuously without slowing down other actions
   * Continuously checks for new animations and animates in queue order.
   */
  public void run() // run() runs asynchronously from the main board logic.
  {
    try {
      while (true) { // continuously check whether animating
        if (tAnim || pAnim) {
          animStartT = System.currentTimeMillis();
          long timeElapsed = 0;
          while (timeElapsed<animTime) {
            // repaint knows whether animations are going on.
            this.repaint();
            Thread.sleep(1000/FPS); // maintain FPS frames/sec
            timeElapsed = System.currentTimeMillis()-animStartT;
          } // while(animating)
          if (tAnim) tAnim = LAnim.requestNextSlide(); // request next slide - nextSlide updates board so we don't have to do it here.
          if (pAnim) {
            Coord delta = Board.getDelta(currDir); // update currPos only after animation completes!
            currPos.x+=delta.x;
            currPos.y+=delta.y;

            pAnim = LAnim.requestNextMove(); // request next move direction.
            if (Board.wonQ&&!pAnim) {
              repaint();
              LUI.winLevel(); // must finish painting before calling the win dialogs! - This function is blocking until dialog is dismissed
            }
          }
          animStartT = System.currentTimeMillis(); // animation resets
          repaint(); // repaint completed animation
        } // if (Main.animatingQ
        Thread.sleep(1000/FPS); // maintain FPS frames/sec
      } // while(true)
    } catch (Exception e) {
      e.printStackTrace();
    } // try-catch.
  } // run()


    // NOTE: THESE FIGURES ARE CALCULATED WITH ALL IMAGES ANCHORED TO THE TOP-RIGHT
    // SIMPLELAYOUT IMAGE DIMENSIONS AND RATIOS ARE DIFFERENT SO THEY MUST BE HANDLED SEPARATELY

  /**
   * Helper function to get x-offset (in the image-coordinate system, not screen-coordinate system) given @param x
   * Scaling required afterwards!
   *
   * Returns the x-offset.
   */
  private static int getOffsetX(double x)
  {
    if (simpleLayoutQ) return (int)(42 + 200*x);
    return (int) (200 + 903*(x/2));
  } // getOffset()

  /**
   * Helper function to get board-x from an image-coordinate x @param x (scaled from screen-coordinate system)
   *
   * Returns the board-x.
   */
  private static double fromOffsetX(double x)
  {
    if (simpleLayoutQ) return (x-42)/200.0;
    return (int)((x-200)/903.0*2);
  } // getOffset()

  /**
   * Helper function to get y-offset (in the image-coordinate system, not screen-coordinate system) given @param y
   * Scaling required afterwards!
   *
   * Returns the y-offset.
   */
  private static int getOffsetY(double y)
  {
    if (simpleLayoutQ) return (int)(42 + 200*y);
    return (int) (170 + 890*(y/2));
  } // getOffset()

  /**
   * Helper function to get board-y from an image-coordinate y @param y (scaled from screen-coordinate system)
   *
   * Returns the board-y.
   */
  private static double fromOffsetY(double y)
  {
    if (simpleLayoutQ) return (y-42)/200.0;
    return (y-170)/890.0*2;
  } // getOffset()

  /**
   * Helper function to get the scaled player-offset from @param x, @param y, @param yOff
   */
  private static Coord playerOffset(int x, int y, double yOff)
  {
    if (simpleLayoutQ) return new Coord(x/*+(int)(scl*35)*/, y+(int)(scl*10));
    else return new Coord(x+(int)(153*scl), y+(int)((132-secondFOffset*yOff)*scl));
  } // playerOffset()

  /**
   * Recalculates board-sizes and scaling factors according to the frame size.
   * CALL BEFORE ANIMATING!
   */
  private void winSizeUpdated() {
    // recalculate these every time paintComponent is called as window may have been resized!
    int winW = frame.getBounds().width;
    int winH = (int)(frame.getBounds().height*0.9); // ?
    if (winH/winW > 3/4) boardSz = (int)(winW*0.9);
    else boardSz = (int) (winH*0.9);
    if (simpleLayoutQ) scl = boardSz/728.0;
    else scl = boardSz/1707.0;

    left = (winW-boardSz)/2;
    top = (winH-boardSz)/2;
  }

  /**
   * Draws the board configurations and animates all player and tile movements.
   */
  public void paintComponent(Graphics gr)
  {
    winSizeUpdated();

    super.paintComponent(gr);

    long timeElapsed = System.currentTimeMillis()-animStartT;
    double animFrac = timeElapsed/(double)animTime;
    if (!tAnim) animFrac = 0;
    if (animFrac>1) animFrac = 1;


    Rectangle r;
    BufferedImage b = simpleLayoutQ?boardI2:boardI;
    // 1. Draw catacomb background
    gr.drawImage(b, left, top, (int)(b.getWidth()*scl), (int)(b.getHeight()*scl), null);
    // TILE ANIMATION


      // STEP TWO: DRAW TILES (with shadowing)
    drawTiles(gr, animFrac, simpleLayoutQ?TILE_SIMPLE:TILE_NORMAL);


    // STEP THREE: Add board shawdowing - before the overlay is drawn
    if (!simpleLayoutQ) gr.drawImage(brdShadow, left, top, (int)(brdShadow.getWidth()*scl), (int)(brdShadow.getHeight()*scl), null);

    // // STEP FOUR: Draw tile tops (to overlap shadows)
    drawTiles(gr, animFrac, simpleLayoutQ?TILE_SIMPLE:TILE_TOP);

    // STEP FIVE: Draw board bottom overlay (to cover perspective overlaps)

    if (!simpleLayoutQ) {
      gr.drawImage(bottomI, left, top+(int)((boardI.getHeight()-bottomI.getHeight())*scl),
                  (int)(bottomI.getWidth()*scl), (int)(bottomI.getHeight()*scl), null);
    } // if (!simpleLayoutQ)
    else {
      // Simplelayout: No additional offsets.
      gr.drawImage(bottomI2, left, top,
                  (int)(bottomI2.getWidth()*scl), (int)(bottomI2.getHeight()*scl), null);
    }

    //////////////////////////////////////
    // STEP SIX: Player animation
    timeElapsed = System.currentTimeMillis()-animStartT;
    animFrac = timeElapsed/(double)animTime;
    if (!pAnim) animFrac = 0;
    if (animFrac>1||animFrac<0) return;

    Coord delta = Board.getDelta(currDir);
    double yOff = 0;
    if (pAnim && currPos.x+delta.x < 0) {
      yOff = !Board.isUpStairsQ(Board.board[currPos.y][currPos.x], currDir)?1:Math.min(1, animFrac*2);
      if (animFrac >0.75) yOff =  1-(animFrac-0.75)*4;
    }
    else {
      if (pAnim && Board.secondFloorQ(Board.board[currPos.y][currPos.x])) { // win is on 2nd floor
        yOff = 1; // Moving on 2nd floor: Apply full player position y-offset
      }
      else if (pAnim && Board.isUpStairsQ(Board.board[currPos.y][currPos.x], currDir)) {
        yOff = Math.min(1, animFrac*2);// going up stairs: player-position y-offset changes with animFrac_P
      }
      if (pAnim &&
        Board.isDownStairsQ(Board.board[currPos.y+delta.y][currPos.x+delta.x], currDir)) { // down stairs: check if next piece is going down
        if (animFrac >=0.5) yOff = 1-(animFrac-0.5)*2;
      }
    }
    double xPos = currPos.x+delta.x*animFrac;
    if (currPos.x+delta.x < 0) xPos = currPos.x+delta.x*1.25*animFrac;
    if (!pAnim && Board.wonQ) xPos = currPos.x-0.25;
    r = toDims(xPos, currPos.y+delta.y*animFrac,
               simpleLayoutQ?playerI2.getWidth():playerI.getWidth(), simpleLayoutQ?playerI2.getWidth():playerI.getHeight());
    Coord pOff = playerOffset(r.x, r.y, yOff);
    gr.drawImage(simpleLayoutQ?playerI2:playerI, pOff.x, pOff.y, r.width, r.height, null);
  } // paintComponent()

  private void drawTiles(Graphics gr, double animFrac, int drawType)
  {
    Rectangle r;
    int dx = currA.toX-currA.fromX;
    int dy = currA.toY-currA.fromY;
    BufferedImage tileI = getImg(currA.tID1, drawType);

    ////////////////////////////////////
    // STEP TWO: Draw all images in order from right to left and back to front
    for (int i=drawType==TILE_TOP?8:0; drawType==TILE_TOP?i>=0:i<9; i+=drawType==TILE_TOP?-1:1) {
      int x, y;
      if (dx!=0) { // side move
        y = 2-i/3;
        x = 2-i%3;
      } else {
        y = 2-i%3;
        x = 2-i/3;
      }
      if (tAnim &&x==currA.fromX&&y==currA.fromY) {
        r = toDims(currA.fromX+dx*animFrac, currA.fromY+dy*animFrac, tileI.getWidth(), tileI.getHeight());
        gr.drawImage(tileI, r.x, r.y, r.width, r.height, null);
      }
      // Sliding tile B (if applicable)
      if (tAnim && currA.twoTileSlide && (x==currA.fromX2&&y==currA.fromY2)) {
        BufferedImage tileI2 = getImg(currA.tID2, drawType);
        r = toDims(currA.fromX2+dx*animFrac, currA.fromY2+dy*animFrac, tileI2.getWidth(), tileI2.getHeight());
        gr.drawImage(tileI2, r.x, r.y, r.width, r.height, null);
        // try {Thread.sleep(100);} catch (Exception e) {e.printStackTrace();}
      }
      // All non-moving tiles
      if (x==currA.fromX&&y==currA.fromY||x==currA.toX&&y==currA.toY|| // check only the currA.fromx,y etc for one tile movement
        currA.twoTileSlide && (x==currA.fromX2&&y==currA.fromY2||x==currA.toX+dx&&y==currA.toY+dy)) // must also check currA.fromx2, currA.fromy2, etc. for 2 tiles.
        if (tAnim) continue;
      if (Board.board[y][x] == 0) continue;
      BufferedImage img = getImg(Board.board[y][x], drawType);
      r = toDims(x, y, img.getWidth(), img.getHeight());
      gr.drawImage(img, r.x, r.y, r.width, r.height, null);

    } // for(x)
  } // drawTiles()

  private BufferedImage getImg(int id, int type)
  {
    switch (type) {
      case TILE_NORMAL:
        return imgs[id];
      case TILE_SIMPLE:
        return imgs2[id];
      case TILE_TOP:
        return imgs3[id];
    }
    return null;
  }

  /**
   * Helper function to generate a scaled rectangle from the given information
   *
   * Returns the dimension rectangle.
   */
  public static Rectangle toDims(double x, double y, int width, int height) {

    return new Rectangle(left+(int)(getOffsetX(x)*scl), top+(int)(getOffsetY(y)*scl), (int)(width*scl), (int)(height*scl));
  }
  /**
   * Helper function to find the board position (as a coordinate) from a screen position @param c
   *
   * Returns the board position coordinates.
   */
  public static Coord clickedPos(Coord c) {

    return new Coord((int)fromOffsetX((c.x-left)/scl), (int)fromOffsetY((c.y-top)/scl));
  }

} // class DrawHandler