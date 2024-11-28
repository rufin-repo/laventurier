// Name RUFIN H
// Date 15 Jan 2023
// Description Game logic handlers for the game.

import java.util.ArrayList;

public class Board
{
  //     >=9: floor-2 STAIRS  5, 6 VERTSTAIRS 7, 8 HORZSTAIRS
  // text-characters for debug board-printing and ease of level creation.
  private static char[] textChars = {'C', '┘', '└', '┌', '┐', '↓', '↑', '→', '←', '╝', '╚', '╔', '╗', '═', '║'};
  //                                  0   1     2    3    4     5   6    7    8    9    10   11  12   13   1
  // direction codes
  public static final int N=1, E=2, W=4, S=8;
  // Information about the walls of the nth tile-type. (0 is empty and has all walls so player cannot enter it.)
  private static final int[] wallInfo = {N|E|S|W, S|E, S|W, N|W, N|E, E|W, E|W, N|S, N|S, S|E, S|W, N|W, N|E, N|S, E|W};

  private static final int[] sDir={N,E,S,W};
  // sDirIdx[] NESW code to 0..3 dir idx:  N E   W       S
  private static final int[] sDirIdx   ={0,0,1,0,3,0,0,0,2};
  private static final int[][] sLvl=  // Level connectivity of the rooms
  {//N E S W  RmLvl
    {0,0,0,0, 0},  // 'C'  A vacant cell (a dummy record)
    {1,0,0,1, 1},  // '┘'
    {1,1,0,0, 1},  // '└'
    {0,1,1,0, 1},  // '┌'
    {0,0,1,1, 1},  // '┐'
    {1,0,2,0, 1},  // '↓'
    {2,0,1,0, 1},  // '↑'
    {0,2,0,1, 1},  // '→'
    {0,1,0,2, 1},  // '←'
    {2,0,0,2, 2},  // '╝'
    {2,2,0,0, 2},  // '╚'
    {0,2,2,0, 2},  // '╔'
    {0,0,2,2, 2},  // '╗'
    {0,2,0,2, 2},  // '═'
    {2,0,2,0, 2},  // '║'
  };
  // delta-x delta-y tables indexed by dirIdx (0..3)
  private static final int[] sDx={0,1,0,-1};
  private static final int[] sDy={-1,0,1,0};
  public static int[][] board; // fixed 3x3 board.
  public static Coord playerPos, vacantPos; // player pos, empty pos

  // movement steps for the current move (2nd floor movements are automated and stored here)
  private static ArrayList<Integer> moveSteps;


  // level completion flag
  public static boolean wonQ = false;

  /**
   * Public entry point for calling player movement according to direction @param dir
   * Required data is filled in by Main.
   */
  public static void movePlayer(int dir) {movePlayer(playerPos.x, playerPos.y, dir, false);}

  private static boolean canMoveTowardsQ(int fromx, int fromy, int dir)
  {
    int dirIdx=sDirIdx[dir];
    int fromTile=board[fromy][fromx];
    if (sLvl[fromTile][dirIdx]==0)
      return false;
    else {
      int tox=fromx+sDx[dirIdx];
      int toy=fromy+sDy[dirIdx];
      if (tox==-1 && toy==0)  // exiting
        return true;
      else if (tox==vacantPos.x && toy==vacantPos.y)
        return false;
      else if (tox>=0 && tox<3 && toy>=0 && toy<3) {  // still within the catacomb bounds
        int currTile  = board[fromy][fromx];
        int nextTile  = board[toy][tox];
        int revdirIdx = (dirIdx+2)%4;
        return sLvl[currTile][dirIdx]!=0 && sLvl[currTile][dirIdx]==sLvl[nextTile][revdirIdx];
      }
      else
        return false;
    }
  } // canMoveTowardsQ()

  /**
   * Private entry point for attempting to move player.
   * Will recursively call itself trying to find an exit or stairs back to first floor.
   * Also checks for a winning move.
   * Nothing happens if move is invalid.
   */
  private static void movePlayer(int x, int y, int dir, boolean floor2Q) // ATTEMPT to move player
  {
    // exiting maze: bypass bounds check
    if (x == 0 && y == 0 && (floor2Q||board[y][x]==8) && dir == W) {// valid exit combination/using stairs!
      moveSteps.add(dir);
      wonQ = true;
      // addAllCurrentMoves();
    } // if (...
    else if (canMoveTowardsQ(x,y,dir)) { //checkBounds(x, y, dir) && noWallQ(x, y, dir)) {
      int dx = 0, dy = 0;
      if (dir == S) dy = 1;
      if (dir == N) dy =-1;
      if (dir == E) dx = 1;
      if (dir == W) dx =-1;
      int nextTile = board[y+dy][x+dx];
      if (!secondFloorQ(nextTile)) { // next step is on floor 1.
        moveSteps.add(dir); // exited sucessfully
        // addAllCurrentMoves();
        // return;
      }
      else if (canMoveTowardsQ(x,y,dir)) {
        int dirIdx=sDirIdx[dir];
        moveSteps.add(dir);
        while (secondFloorQ(nextTile)) {
          x+=dx; y+=dy;       // Now we are at this updated x,y cell.
          int exitDirIdx=-1;  // We are going to find a valid exit dirIdx from the cell at (x,y)
          int frmDirIdx=(dirIdx+2)%4;
          for (int d=0; d<4; d++) {
            if (d!=frmDirIdx && canMoveTowardsQ(x,y,sDir[d])) {
              exitDirIdx=d;
              break;
            }
          } // for (d)

          if (exitDirIdx>=0)
            dirIdx=exitDirIdx;
          else  // No valid exit direction found.
            dirIdx=(dirIdx+2)%4;  // Turn backward and retrace the beaten track.

          moveSteps.add(sDir[dirIdx]);
          dx=sDx[dirIdx];
          dy=sDy[dirIdx];
          if (x+dx==-1 && y+dy==0) {  // Exiting the maze.
            wonQ=true;
            break;
          }
          else
            nextTile=board[y+dy][x+dx];
        } // while secondFloorQ
      }
      // else if (isUpStairsQ(currTile, dir)) { // getting on stairs properly
      //   while (!isDownStairsQ(newTile, dir)) {
      //     moveSteps.add(dir);
      //     dx=0;dy=0;
      //     if (dir == S) dy = 1;
      //     if (dir == N) dy =-1;
      //     if (dir == E) dx = 1;
      //     if (dir == W) dx =-1;
      //     currTile = board[y][x];
      //     if ((x+dx)>=0) newTile = board[y+dy][x+dx];
      //     if (checkBounds(x, y, dir) && noWallQ(x, y, dir) && secondFloorQ(newTile)) { // can move

      //       // not exiting - move in direction
      //       dir = (15-wallInfo[newTile])-reverseDir(dir);
      //       x+=dx;
      //       y+=dy;
      //     }// while can move
      //     else if ((x == 0 && y == 0 && (secondFloorQ(newTile)||board[y][x]==8) && dir == W)) { // exiting
      //       moveSteps.add(dir);
      //       wonQ = true;
      //       // addAllCurrentMoves();
      //       // return;
      //       break;
      //     }
      //     else {
      //       dir = (15-wallInfo[currTile])-dir;

      //     };
      //   } // while 2nd floor
      // } // upstairsQ

      // else return; // 1st step failed!
      // attempting to change floors without using stairs!

      // if (floor2Q && newTile >= 9) { // moving along in 2nd floor.
      //   // goes up stairs: move through
      //   int enterWDir = reverseDir(dir);
      //   moveSteps.add(dir);
      //                       // available exits - exit used to enter
      //     // Note that 15 = N|E|W|S (bit-wise or)
      //     // 15-wallInfo[newTile] gives the exits in this tile. Subtract the entry "exit" to get the exit of the current 2nd-floor tile.
      //   int remDir = (15-wallInfo[newTile])-enterWDir;
      //   movePlayer(x+dx, y+dy, remDir, true);
      // } // moving in 2nd floor
      // else if (!floor2Q && (currTile==5&&dir==S||currTile==6&&dir==N||currTile==7&&dir==E||currTile==8&&dir==W)) { // getting on stairs properly
      //   movePlayer(x, y, dir, true);
      // } // taking stairs
      // else if (!floor2Q&&newTile<9
      //        ||floor2Q&&(newTile==5&&dir==N||newTile==6&&dir==S||newTile==7&&dir==W||newTile==8&&dir==E)) {
      //   // not jumping onto 2nd floor, or getting off stairs properly
      //   // ready to animate now.
      //   moveSteps.add(dir);
      //   // animMove()
      //   // drawBoard();
      //   addAllCurrentMoves();
      // } // ready to animate

      // addAllCurrentMoves();
    } // if (canmoveq)
    // if (floor2Q) movePlayer(x, y, (15-wallInfo[board[y][x]])-reverseDir(dir), true);

    addAllCurrentMoves();
    prtBoard();
    moveSteps.clear();
  } // movePlayer()


  /**
   * Helper function to reverse a direction @param dir (south becomes north, etc.)
   *
   * Returns the reversed direction.
   */
  private static int reverseDir(int dir)
  {
    switch (dir) {
      case N: return S;
      case E: return W;
      case W: return E;
      case S: return N;
      default: return 0;
    } // switch (dir)
  } // reverseDir()

  /**
   * Helper function to return a coordinate with the delta-x and delta-y from a direction @param dir.
   *
   * Returns the delta-coordinate.
   */
  public static Coord getDelta(int dir) {
    int dx = 0, dy = 0;
    if (dir == S) dy = 1;
    if (dir == N) dy =-1;
    if (dir == E) dx = 1;
    if (dir == W) dx =-1;
    return new Coord(dx, dy);
  } // getDelta()

  /**
   * Helper function to check whether an attempted move will be out of bounds.
   *
   * Returns true if move is valid at this point, false otherwise.
   */
  private static boolean checkBounds(int x, int y, int dir)
  {
    switch (dir) {
      case N: return y-1 >= 0;
      case W: return x-1 >= 0;
      case E: return x+1 < 3;
      case S: return y+1 < 3;
      default: return false;
    }
  } // checkBounds()

  /**
   * Helper function to check whether an attempted move will be passing through a wall.
   *
   * Returns true if move is valid at this point, false otherwise.
   */
  public static boolean noWallQ(int fromX, int fromY, int dir)
  {
    int dx = 0, dy = 0;
    if (dir == S) dy = 1;
    if (dir == N) dy =-1;
    if (dir == E) dx = 1;
    if (dir == W) dx =-1;

    int wi = wallInfo[board[fromY][fromX]];
    int wi2 = wallInfo[board[fromY+dy][fromX+dx]];
    if (dir == W)
      return (wi2&E | wi&W) == 0;
    if (dir == E)
      return (wi2&W | wi&E) == 0;
    if (dir == S)
      return (wi2&N | wi&S) == 0;
    if (dir == N)
      return (wi2&S | wi&N) == 0;
    return false;
  } // noWallQ()

  /**
   * Debug function for displaying textual representation of board from before graphics implementation.
   * Prints the board using unicode characters.
   */
  private static void prtBoard() // debug purposes
  {
    for (int y=0; y<3; y++) {
      for (int x=0; x<3; x++) {
        if (x==playerPos.x&&y==playerPos.y) System.out.print("P");
        else System.out.print(textChars[board[y][x]]);
      }
      System.out.println();
    }
    System.out.println("Player pos: ("+playerPos.x+", "+playerPos.y+")");
  } // prtBoard()


  /**
   * Updates the board state given a tile-coordinate @param x, @param y to be shifted.
   * DOES NOT PERFORM ERROR-CHECKING! CHECK BEFORE CALLING!
   */
  public static void slideTile_B(int x, int y)
  {
    if (x == vacantPos.x - 2) { // 2-tile, horzslide, tile to be slid is on the left
      board[vacantPos.y][vacantPos.x] = board[vacantPos.y][vacantPos.x-1];
      board[vacantPos.y][vacantPos.x-1] = board[vacantPos.y][x];
      board[vacantPos.y][x] = 0;
    }
    else if (x == vacantPos.x + 2) {// 2-tile, horzslide, tile to be slid is on the right
      board[vacantPos.y][vacantPos.x] = board[vacantPos.y][vacantPos.x+1];
      board[vacantPos.y][x-1] = board[vacantPos.y][x];
      board[vacantPos.y][x] = 0;
    }
    else if (y == vacantPos.y - 2) { // 2-tile, vertslide, tile to be slid is on the top
      board[vacantPos.y][vacantPos.x] = board[vacantPos.y-1][vacantPos.x];
      board[vacantPos.y-1][vacantPos.x] = board[y][vacantPos.x];
      board[y][vacantPos.x] = 0;
    }
      else if (y == vacantPos.y + 2) { // 2-tile, vertslide, tile to be slid is on the bottom
      board[vacantPos.y][vacantPos.x] = board[y-1][vacantPos.x];
      board[y-1][vacantPos.x] = board[y][vacantPos.x];
      board[y][vacantPos.x] = 0;
    }
    else { // 1-tile slide
      board[vacantPos.y][vacantPos.x] = board[y][x];
      board[y][x] = 0;
    }
    // update empty coordinates
    vacantPos.x = x;
    vacantPos.y = y;
  } // slideTile_B()

  /**
   * Adds all current moves in moveSteps (2nd floor moves) to the animation queue.
   * DOES NOT PERFORM ERROR-CHECKING!
   */
  private static void addAllCurrentMoves()
  {
    for (int i=0; i<moveSteps.size(); i++) {
      int dir = moveSteps.get(i);
      int dx = 0, dy = 0;
      if (dir == S) dy = 1;
      if (dir == N) dy =-1;
      if (dir == E) dx = 1;
      if (dir == W) dx =-1;
      playerPos.x += dx;
      playerPos.y += dy;
      LAnim.addMove(dir);
    } // for (i)
    moveSteps.clear();
    //prtBoard();
  } // updatePlayerPos()

  /**
   * Duplicates the board for DrawHandler to have a snapshot of the current board status when animating.
   *
   * Returns a duplicate of the board, copied by value and not reference.
   */
  public static int[][] duplBoard()
  {
    int[][] newArr = new int[3][3];
    for (int y=0; y<3; y++)
      for (int x=0; x<3; x++)
        newArr[y][x] = board[y][x];
    return newArr;
  } // duplBoard()

  /**
   * Checks if the current attempted slide at @param x, @param y is a valid slide.
   * Does NOT return true for an attempted exit from the board!
   *
   * Returns whether the move is valid.
   */
  public static boolean validSlideQ(int x, int y) {
    if (x!=vacantPos.x&&y!=vacantPos.y || x==vacantPos.x&&y==vacantPos.y||x==playerPos.x&&y==playerPos.y) return false;
    // if player piece, empty spot and the sliding tile are in the same row.column
    // AND the player and the empty space are adjacent AND player, click are adjacent then the slide is not allowed
    // (you would slide the player too)
    if (x==vacantPos.x&&x==playerPos.x&&Math.abs(vacantPos.y-playerPos.y)==1&&Math.abs(playerPos.y-y)==1
      ||y==vacantPos.y&&y==playerPos.y&&Math.abs(vacantPos.x-playerPos.x)==1&&Math.abs(playerPos.x-x)==1) return false;
    return true;
  } // validSlideQ()

  /**
   * Helper function to find whether a player moving from the tile with code @param code
   * is going upstairs in the given direction @param dir
   *
   * Returns whether the move is going upstairs
   */
  public static boolean isUpStairsQ(int code, int dir) {
    // System.out.println(code);
    return code==5&&dir==S || code==6&&dir==N ||
           code==7&&dir==E || code==8&&dir==W;
  } // isStairsQ()

  /**
   * Helper function to find whether a player moving from the tile with code @param code
   * is going downstairs in the given direction @param dir
   *
   * Returns whether the move is going downstairs
   */
  public static boolean isDownStairsQ(int code, int dir) {
    return code==5&&dir==N || code==6&&dir==S ||
           code==7&&dir==W || code==8&&dir==E;
  } // isStairsQ()

  /**
   * Helper function to find whether the tile with code @param code is a second-floor tile.
   */
  public static boolean secondFloorQ(int code) {
    return code >=9;
  } // isStairsQ()



  public static void main(String[] args)
  {
    moveSteps = new ArrayList<Integer>();
    board = new int[3][3];
    new Board();
    new LUI();
    new LAnim();
  } // main()
}