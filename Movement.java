// Name RUFIN H
// Date 15 Jan 2023
// Description Helper classes for keeping track of tile-slide events and player movement events.

class Movement
{
  int fromY, toY, fromX, toX, fromX2, fromY2, tID1, tID2;
  boolean twoTileSlide;

 /**
  * Initialises tile slide information according to tile from, to and tile IDs
  */
  Movement(int fX, int tX, int fY, int tY, int fX2, int fY2, int t1, int t2)
  { // tile-IDs are required to be passed in because the board changes immediately after the constructor is called.
    // So we cannot look for the tile-ID from Main.board[y][x].
    fromX=fX;toX=tX;fromY=fY;toY=tY;
    fromX2=fX2;fromY2=fY2;
    tID1=t1; tID2=t2;
    twoTileSlide = true;
  } // Movement 2-room-shift ctor

  /**
   * Initialises tile slide information for one-tile-sliding
   */
  Movement(int fX, int tX, int fY, int tY, int t1)
  {
    fromX=fX;toX=tX;fromY=fY;toY=tY;
    fromX2=-1;fromY2=-1;
    tID1 = t1;
    twoTileSlide = false;
  } // Movement 1-room-shift ctor
} // class Movement

class Coord
{
  int x, y;
  Coord(int xx, int yy) {x=xx;y=yy;}
  // .equals is not automatically comparing by value!
  boolean equals(Coord second) {return x==second.x&&y==second.y;}
} // class Coord
