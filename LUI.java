// Name RUFIN H
// Date 15 Jan 2023
// Description User Interface handlers for the game.

import java.awt.*;
import java.awt.event.*;
import javax.swing.*;
import java.util.ArrayList;
import java.util.Scanner;
import java.io.File;
import javax.sound.sampled.*;
// import javax.imageio.*;

public class LUI implements MouseListener, KeyListener, ActionListener
{
  // UI has control of frame, level information and sounds.
  public static JFrame frame;
  // these two will not change after filereading!
  private static ArrayList<String> levels;
  private static String aboutText;
  // private static String[] help;
  private static ImageIcon instrImg1, ico;
  private static int currLevel;
  // menu bar
  private static JMenuBar mainMenu;
  public static Clip tSound, pSound, wSound;
  private static Coord clickStartPos;
  private static JPanel instrPanel;
  // private static JTextArea textArea;

  // the current LUI instance for required non-static methods
  public static LUI uiHandle;

  /**
   * Handles key-press events and attempts to move the player
   * @param e KeyboardEvent to determine movement direction
   */
  public void keyPressed(KeyEvent e)
  {
    if (RenderThread.tAnim||Board.wonQ) return;
    switch (e.getKeyCode()) {
      case KeyEvent.VK_DOWN:
      case KeyEvent.VK_S:
        Board.movePlayer(Board.S);
        break;
      case KeyEvent.VK_UP:
      case KeyEvent.VK_W:
        Board.movePlayer(Board.N);
        break;
      case KeyEvent.VK_RIGHT:
      case KeyEvent.VK_D:
        Board.movePlayer(Board.E);
        break;
      case KeyEvent.VK_LEFT:
      case KeyEvent.VK_A:
        Board.movePlayer(Board.W);
        break;
    } // switch (e.getKeyChar())
  } // keyPressed(keyEvent e)

  /**
   * Mouse clicked event required by KeyListener
   * @param e not used
   */
  public void mouseClicked(MouseEvent e) {}

  /**
   * MousePressed handler records clickstart position (move player or tile?)
   * @param e MouseEvent for mouse coordinate tracking
   */
  public void mousePressed(MouseEvent e) {
    clickStartPos = new Coord(e.getX(), e.getY()-mainMenu.getHeight());
  } // mousePressed()

  /**
   * Given two coordinates, calculates and returns the primary movement direction of the drag (N/E/S/W)
   * @param from: Click start position @param to: Click release position
   */
  private int clickDir(Coord from, Coord to) {
    int dx = to.x-from.x;
    int dy = from.y-to.y;
    double theta = Math.atan2(dy, dx);
    if (theta<0) theta = 2*Math.PI+theta;
    if (theta >= Math.PI*7/4 || theta <= Math.PI/4) return Board.E;
    if (theta >= Math.PI/4 && theta <= Math.PI*3/4) return Board.N;
    if (theta >= Math.PI*3/4 && theta <= Math.PI*5/4) return Board.W;
    return Board.S;
  } // clickDir()

  /**
   * Moves player, tile or prompts user to select a level (only when level is complete)
   * @param args not used
   */
  public void mouseReleased(MouseEvent e)
  {
    if (!RenderThread.tAnim && RenderThread.clickedPos(clickStartPos).equals(Board.playerPos)) {
      Board.movePlayer(clickDir(clickStartPos, new Coord(e.getX(), e.getY()-mainMenu.getHeight())));
      return;
    }
    if (RenderThread.pAnim) return;
    if (Board.wonQ) {
      levelSelector();
      return;
    }
    Coord boardPos = RenderThread.clickedPos(clickStartPos);
    int clickX = boardPos.x;
    int clickY = boardPos.y;
    if (clickX < 0 || clickY < 0 || clickX >=3 || clickY >= 3) return;
    LAnim.addSlide(new Coord(clickX, clickY));
  } // mouseReleased()

  /**
   * Required methods from MouseListener and KeyListener...
   */
  public void mouseExited(MouseEvent e) {}
  public void keyReleased(KeyEvent e) {}
  public void keyTyped(KeyEvent e) {}
  public void mouseEntered(MouseEvent e) {}

  /**
   * Handles menu-item clicks and redirects to the corresponding method
   * @param e used to determine which menu item was clicked
   */
  public void actionPerformed(ActionEvent e)
  {
    String cmd = e.getActionCommand();
    if (cmd.equals("Exit"))
      System.exit(0);
    if (cmd.equals("Select Level..."))
      levelSelector();
    if (cmd.equals("Restart Level"))
      loadLevel(currLevel);
    if (cmd.matches("^About .*"))
      aboutMenu();
    if (cmd.equals("How to Play"))
      playInstrs();
    if (cmd.equals("Animation Speed..."))
      animTime();
    if (cmd.equals("Toggle Simple/Photorealistic Rooms"))
      toggleAssets();
  } // actionPerformed()

  /**
   * Prompts the user to select a level, with default value being currentLevel+1.
   * Re-prompts with input is invalid until user cancels.
   */
  private static void levelSelector()
  {
    int lvl;
    do  {
      try {
        String lvlTxt = (String) JOptionPane.showInputDialog(frame, "Select level: (1-"+levels.size()+")", "Level selection", JOptionPane.QUESTION_MESSAGE, null, null, currLevel+2);
        if (lvlTxt==null) return;
        else lvl = Integer.parseInt(lvlTxt);
      } catch (Exception e) {lvl = -1;}
    } while (!loadLevel(lvl-1));
  } // levelSelector()

  /**
   * Prompts the user to enter a new animation speed (in seconds/action!).
   * Re-prompts with input is invalid until user cancels.
   */
  private static void animTime()
  {
    double speed;
    do  {
      try {
        String spdTxt = (String) JOptionPane.showInputDialog(frame, "Enter a new animation speed (seconds/action):", "Settings", JOptionPane.QUESTION_MESSAGE, null, null, RenderThread.animTime/1000.0);
        if (spdTxt==null) return;
        else speed = Double.parseDouble(spdTxt);
      } catch (Exception e) {speed = -1;}
    } while (speed>2||speed<0.05);
    RenderThread.updateAT((int)(speed*1000));
  } // levelSelector()


  /**
   * Plays the winning sound and alerts the user of their win
   */
  public static void winLevel()
  {
    wSound.setFramePosition(0);
    wSound.start();
    JOptionPane.showMessageDialog(frame, "You completed level "+(currLevel+1)+"!", "Level complete!", JOptionPane.INFORMATION_MESSAGE);
    levelSelector();
  } // winLevel()

  /**
   * Displays the about-menu.
   */
  private static void aboutMenu()
  {
    JOptionPane.showMessageDialog(frame, aboutText, "Rufin's L'Aventurier", JOptionPane.INFORMATION_MESSAGE, ico);
    // JScrollPane scrlPane = new JScrollPane(new ScrollablePicture(aboutImg, 10));
    // JOptionPane jop = new JOptionPane();
    // JDialog dialog = jop.createDialog("Test");
    // dialog.setContentPane(scrlPane);
    // dialog.setVisible(true);
  } // winLevel()

  /**
   * Displays the how-to-play instructions.
   */
  private static void playInstrs()
  {
    instrPanel = new JPanel();
    // JOptionPane.showMessageDialog(frame, instructionText, "How to Play", JOptionPane.INFORMATION_MESSAGE);
    instrPanel.setLayout(new GridLayout(1, 1));
    instrPanel.setPreferredSize(null);
    JLabel imgLabel1 = new JLabel(instrImg1);
    // imgLabel1.setMaximumSize(new Dimension(800, imgLabel1.getHeight()));

    // JTextArea textArea = new JTextArea(help[0]);
    // textArea.setWrapStyleWord(true);
    // textArea.setLineWrap(true);
    // textArea.setOpaque(false);
    // textArea.setEditable(false);
    // textArea.setFocusable(false);
    // // someText.setPreferredSize(null);
    // textArea.setPreferredSize(new Dimension(instrPanel.getWidth(), 0));

    // instrPanel.add(textArea);

    instrPanel.add(imgLabel1);
    // image(label of instrImg) and other text goes into the panel (panel).
    JScrollPane scrlPane = new JScrollPane(instrPanel);
    // panel goes into the scrollPanel.
    JOptionPane jop = new JOptionPane();
    jop.setPreferredSize(new Dimension(600, 800));
    // create a dialog from a JOptionPane then put the scrollPanel into the dialog.
    JDialog dialog = jop.createDialog("How to Play");
    dialog.setContentPane(scrlPane);
    dialog.setResizable(true);
    dialog.setMinimumSize(new Dimension(instrImg1.getIconWidth()+40, 0));
    dialog.setVisible(true);
  } // winLevel()

  /**
   * Changes between the simple layout and the realistic layout images.
   */
  public static void toggleAssets() {
    RenderThread.simpleLayoutQ=!RenderThread.simpleLayoutQ;
    LAnim.dHandle.repaint();
  } // toggleAssets()

  /**
   * Starts a new level, given @param levelID.
   * Resets all position and tile configurations to the level specification
   * REQUIRES LEVEL-FILE READ AND IMPORTED!
   *
   * Returns whether level-loading was successful.
   */
  public static boolean loadLevel(int levelID)
  {
    if (levels.size() <= levelID || levelID<0) return false;
    currLevel = levelID;
    Board.wonQ = false;
    String lvl = levels.get(levelID);
    String[] eles = lvl.split(" +"); // split by any number of spaces
    for (int i=0; i<9; i++) {
      Board.board[i/3][i%3] = Integer.parseInt(eles[i]);
    }
    Board.playerPos = new Coord(Integer.parseInt(eles[9]), Integer.parseInt(eles[10]));
    Board.vacantPos = new Coord(Integer.parseInt(eles[11]), Integer.parseInt(eles[12]));
    if (LAnim.dHandle!=null) LAnim.dHandle.reset();
    return true;
  } // newGame()

  /**
   * Initialises menu items and adds actionListeners. Called on game-start.
   */
  private void initMenus()
  {
    mainMenu = new JMenuBar();

    JMenu gameMenu = new JMenu("Game");
      JMenuItem levelSelect = new JMenuItem("Select Level...");
      levelSelect.addActionListener(this);
      gameMenu.add(levelSelect);
      JMenuItem levelRestart= new JMenuItem("Restart Level");
      levelRestart.addActionListener(this);
      gameMenu.add(levelRestart);
      JMenu settingsMenu = new JMenu("Settings");
        JMenuItem animSpeed = new JMenuItem("Animation Speed...");
        animSpeed.addActionListener(this);
        settingsMenu.add(animSpeed);
        JMenuItem tSimpleLayout = new JMenuItem("Toggle Simple/Photorealistic Rooms");
        tSimpleLayout.addActionListener(this);
        settingsMenu.add(tSimpleLayout);
      gameMenu.add(settingsMenu);
      JMenuItem exitGame = new JMenuItem("Exit");
      exitGame.addActionListener(this);
      gameMenu.add(exitGame);
    mainMenu.add(gameMenu);

    JMenu helpMenu = new JMenu("Help");
      JMenuItem about = new JMenuItem("About this Program");
      about.addActionListener(this);
      helpMenu.add(about);
      JMenuItem rules = new JMenuItem("How to Play");
      rules.addActionListener(this);
      helpMenu.add(rules);
    mainMenu.add(helpMenu);


    frame.setJMenuBar(mainMenu);
  } // initMenus()

  /**
   * Reads in the level, about and instructions file and initialises the levels array.
   */
  private static void readFile() throws Exception
  {
    levels = new ArrayList<String>();
    aboutText = "";
    // help = new String[4];
    Scanner fin = new Scanner(new File("L_DAT/Levels.txt"));
    while (fin.hasNextLine()) {
      levels.add(fin.nextLine());
    }
    fin = new Scanner(new File("L_DAT/about.txt"));
    while (fin.hasNextLine()) {
      aboutText+=fin.nextLine()+"\n";
    }
    // fin = new Scanner(new File("L_DAT/Instructions.txt"));
    // int i=0;
    // while (fin.hasNextLine()) {
    //   help[i]=fin.nextLine()+"\n";
    //   i++;
    // }
  } // readFile()

  /**
   * Loads all sound files.
   */
  private static void loadSounds() throws Exception
  {
    AudioInputStream is = AudioSystem.getAudioInputStream(new File("L_RSRC/TileSlide.wav"));
    tSound = AudioSystem.getClip();
    tSound.open(is);
    is = AudioSystem.getAudioInputStream(new File("L_RSRC/PlayerMove.wav"));
    pSound = AudioSystem.getClip();
    pSound.open(is);
    is = AudioSystem.getAudioInputStream(new File("L_RSRC/LevelComplete.wav"));
    wSound = AudioSystem.getClip();
    wSound.open(is);
  } // playSound()
  /**
   * Resets audio clips to their starting positions and stops playing them.
   */
  public static void resetAudio()
  {
    tSound.stop();
    tSound.setFramePosition(0);
    pSound.stop();
    pSound.setFramePosition(0);
    wSound.stop();
    wSound.setFramePosition(0);
  } // resetAudio()

  public static void loadImgs()
  {
    // aboutImg = new ImageIcon("L_RSRC/Tile1.png");
    instrImg1 = new ImageIcon("L_RSRC/HowToPlay.jpg");
    ico = new ImageIcon("L_RSRC/icon.png");
    // instrImg2 = new ImageIcon("L_RSRC/MovingAdventurer.png");
    // instrImg3 = new ImageIcon("L_RSRC/SlidingRoomTiles.png");
  } // loads scrollable ImageIcons for


  /**
   * Initialises frame, current levels, file-reading, sounds, menus, levels and starts the drawHandler.
   */
  public LUI()
  {
    frame = new JFrame ("L'Aventurier");
    currLevel = -1;
    uiHandle = this;
    frame.setPreferredSize(Toolkit.getDefaultToolkit().getScreenSize()); // maximum frame size
    try {
      readFile();
      loadSounds();
      initMenus();
      loadImgs();
      levelSelector();
      if (currLevel < 0) System.exit(0);
      LAnim.dHandle = new RenderThread(frame);
      frame.addKeyListener(this);
      frame.addMouseListener(this);
      frame.add(LAnim.dHandle);
      // frame.add(pDraw);
      frame.pack();
      frame.setVisible(true);
      frame.setLayout(null);
      frame.setExtendedState(frame.getExtendedState() | JFrame.MAXIMIZED_BOTH);
      frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
    } catch (Exception e) {e.printStackTrace();}
  } // main method

} // class LUI
