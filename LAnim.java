// Name RUFIN H
// Date 15 Jan 2023
// Description Animation handlers for the game.

import java.util.ArrayList;
import javax.sound.sampled.Clip;

public class LAnim {
  private static ArrayList<Integer> pAnimQueue;
  private static ArrayList<Coord> tAnimQueue;
  private static Movement activeSlide = null;

  // dHandle is also a JPanel!
  public static RenderThread dHandle;
  // for continuously looping the drawHandler animations
  public static Thread TDThread;

  /**
   * Creates a TileSlideInfo from slide @param from and @param to coordinates
   */
  private static Movement toTSI(Coord from, Coord empty) // from a click and an empty-tile pos generate a TileSlideInfo object.
  {
    final int x=from.x, y=from.y;
    if (x == empty.x - 2) {
      return new Movement(x, x+1, y, y, x+1, y, Board.board[y][x], Board.board[y][x+1]);
    }
    else if (x == empty.x + 2) {
      return new Movement(x, x-1, y, y, x-1, y, Board.board[y][x], Board.board[y][x-1]);
    }
    else if (y == empty.y - 2) {
      return new Movement(x, x, y, y+1, x, y+1, Board.board[y][x], Board.board[y+1][x]);
    }
    else if (y == empty.y + 2) {
      return new Movement(x, x, y, y-1, x, y-1, Board.board[y][x], Board.board[y-1][x]);
    }
    else {
      return new Movement(x, empty.x, y, empty.y, Board.board[y][x]);
    }
  } // toTSI
  /**
   * Adds a slide position @param c to the tile-slide loop.
   * Performs error-checking before adding to queue.
   */
  public static void addSlide(Coord c)
  {
    if (activeSlide == null) {
      activeSlide = toTSI(c, new Coord(Board.vacantPos.x, Board.vacantPos.y));
      if (!Board.validSlideQ(activeSlide.fromX, activeSlide.fromY)) {
        activeSlide = null;
        return;
      }
      Board.slideTile_B(activeSlide.fromX, activeSlide.fromY);
      LUI.tSound.setFramePosition(0);
      LUI.tSound.loop(Clip.LOOP_CONTINUOUSLY);
      LUI.tSound.start();
      dHandle.pushSlide(activeSlide);
    }
    else {
      tAnimQueue.add(c);
    } // active slide - there is an animation waiting to finish
  }
  /**
   * Adds a move direction @param dir to the player-move loop.
   * WARNING: DOES NOT PERFORM ERROR-CHECKING - CHECK BEFORE CALLING
   */
  public static void addMove(int dir)
  {
    if (dHandle.currDir <= 0) {
      LUI.pSound.setFramePosition(0);
      LUI.pSound.loop(Clip.LOOP_CONTINUOUSLY);
      LUI.pSound.start();
      dHandle.pushMove(dir);
    }
    else {
      pAnimQueue.add(dir);
    }
  }
  /**
   * Call-back for DrawHandler to let LAnim know that the current animation has completed
   * and that it needs another slide movement to be taken from the slide-queue.
   * Slide-queue elements may not be error-checked.
   *
   * Returns whether there is another element sent to DrawHandler.
   */
  public static boolean requestNextSlide() { // requesting next slidetiler. Returns 0 if slide queue is empty.
    if (tAnimQueue.size() == 0) {
      activeSlide = null;
      LUI.tSound.stop();
      return false;
    }
    do {
      Coord currC = tAnimQueue.remove(0);
      activeSlide = toTSI(currC, new Coord(Board.vacantPos.x, Board.vacantPos.y));
    }
    while (!Board.validSlideQ(activeSlide.fromX, activeSlide.fromY) && tAnimQueue.size()>0);
    if (tAnimQueue.size() == 0 && !Board.validSlideQ(activeSlide.fromX, activeSlide.fromY)) {
      // no valid slides anymore - stop animation
      activeSlide = null;
      LUI.tSound.stop();
      return false;
    }
    // update board then call animations
    Board.slideTile_B(activeSlide.fromX, activeSlide.fromY);
    dHandle.pushSlide(activeSlide);
    return true;
  }

  /** Call-back for DrawHandler to let LAnim know that the current animation has completed
   * and that it needs another player movement to be taken from the move-queue.
   * Move-queue elements must be error-checked at this point!
   *
   * Returns whether there is another move sent to DrawHandler.
   */
  public static boolean requestNextMove() {
    if (pAnimQueue.size() == 0) {
      dHandle.currDir = 0;
      LUI.pSound.stop();
      return false;
    }
    dHandle.pushMove(pAnimQueue.remove(0));
    return true;
  }

  /**
   * Initialises the player-/tile-animation queues and starts the draw-thread.
   */
  public LAnim() {
    pAnimQueue = new ArrayList<Integer>();
    tAnimQueue = new ArrayList<Coord>();
    TDThread = new Thread(dHandle);
    TDThread.start();
  }
}
