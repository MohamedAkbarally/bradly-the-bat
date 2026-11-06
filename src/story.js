// The story, word for word from the original comic.
// Each beat is one comic panel: a set, some actors, and speech bubbles shown in order.
// `who` is the index of the speaking actor. Bubble x/y is its centre.

// Put her name here and it shows on the title screen and the ending!
export const ARTIST = '';

const HOME = { moon: [800, 95], tree: { x: 150, s: 0.85 }, cam: 0 };

export const STORY = {
  intro: [
    {
      set: HOME,
      actors: [{ type: 'bradly', x: 520, ground: true, s: 1.1, wing: 0.45, look: [-0.7, -0.3] }],
      lines: [{ who: 0, text: 'THIS TREE IS MY HOME. MANY BATS LIVE HERE, EXCEPT MY PARENTS. I NEVER MET THEM.', x: 380, y: 150, maxW: 300 }],
    },
    {
      set: HOME,
      actors: [{ type: 'bradly', x: 520, ground: true, s: 1.1, wing: 0.45, look: [0.4, 0.1], mood: 'joy' }],
      lines: [{ who: 0, text: "HI! I AM BRADLY THE BAT, BUT MOST BATS CALL ME BIG HEAD BRADLY. I DON'T HAVE MUCH FRIENDS, ONLY ONE.", x: 700, y: 160, maxW: 320 }],
    },
    {
      set: { bush: { x: 170, s: 1.4 }, cam: 700 },
      actors: [
        { type: 'henry', x: 330, y: 280, s: 1.5 },
        { type: 'bradly', x: 580, ground: true, s: 1.1, wing: 0.45, look: [-1, 0] },
      ],
      lines: [
        { who: 1, text: "THIS IS MY BEST FRIEND HENRY THE HUMMINGBIRD. OUR DREAM IS TO FLY AWAY TOGETHER TO ANOTHER PLACE. WE CAN'T FLY NOW CAUSE MY WINGS ARE SMALL.", x: 670, y: 150, maxW: 360 },
        { who: 0, text: 'I WISH HIS WINGS WILL GROW BIGGER FAST!', x: 200, y: 130, maxW: 210 },
      ],
    },
    {
      set: { tree: { x: 860, s: 0.8 }, cam: 1300 },
      actors: [
        { type: 'henry', x: 200, y: 260, s: 1.5 },
        { type: 'bradly', x: 380, ground: true, s: 1.1, wing: 0.45, look: [1, -0.3], mood: 'sad' },
        { type: 'meanbat', x: 680, y: 250, s: 1.25, facing: -1, seed: 1 },
        { type: 'meanbat', x: 800, y: 320, s: 1.1, facing: -1, seed: 2 },
      ],
      lines: [{ who: 2, text: 'HAHA LOOK! IT IS BIG HEAD BRADLY AND HIS WEIRD FRIEND!', x: 620, y: 120, maxW: 300 }],
    },
    {
      set: { moon: [850, 90], cam: 400 },
      actors: [
        { type: 'henry', x: 260, y: 280, s: 1.5 },
        { type: 'bradly', x: 620, ground: true, s: 1.1, wing: 0.45, look: [-1, 0], mood: 'wow' },
      ],
      lines: [
        { who: 0, text: "DON'T LISTEN TO THEM BRADLY, IN THREE WEEKS YOUR WINGS WILL BE BIG ENOUGH TO FLY WITH! WE SHALL LEAVE SOON!", x: 300, y: 130, maxW: 340 },
        { who: 1, text: 'WOW! YOU SURE?', x: 790, y: 210, maxW: 170 },
      ],
    },
  ],
  week1: [
    {
      caption: 'WEEK 1...',
      set: { cam: 200 },
      actors: [
        { type: 'henry', x: 250, y: 280, s: 1.5 },
        { type: 'bradly', x: 600, ground: true, s: 1.1, wing: 0.6, look: [-1, 0], mood: 'joy' },
      ],
      lines: [
        { who: 0, text: '2 WEEKS TO GO!', x: 230, y: 160, maxW: 200 },
        { who: 1, text: "WOW HENRY! YOU'RE RIGHT! A WEEK LATER MY WINGS GREW LARGER!", x: 660, y: 160, maxW: 300 },
      ],
    },
  ],
  week2: [
    {
      caption: 'WEEK 2',
      set: { moon: [860, 95, 'full'], cam: 900 },
      actors: [
        { type: 'henry', x: 250, y: 280, s: 1.5 },
        { type: 'bradly', x: 600, ground: true, s: 1.1, wing: 0.8, look: [-1, 0] },
      ],
      lines: [
        { who: 0, text: '1 WEEK TO GO!', x: 230, y: 160, maxW: 200 },
        { who: 1, text: 'THEY ARE GETTING BIGGER!', x: 610, y: 165, maxW: 220 },
      ],
    },
  ],
  week3: [
    {
      caption: 'WEEK 3!!',
      set: { tree: { x: 880, s: 0.75 }, cam: 1500 },
      actors: [
        { type: 'henry', x: 240, y: 250, s: 1.5, happy: true },
        { type: 'bradly', x: 560, ground: true, s: 1.1, wing: 1, look: [-1, -0.2], mood: 'joy' },
      ],
      lines: [
        { who: 0, text: "YAY! I'M SO HAPPY!", x: 210, y: 140, maxW: 200 },
        { who: 1, text: "THEY ARE BIG NOW! HENRY, LET'S FLY!", x: 560, y: 150, maxW: 260 },
      ],
    },
  ],
};

export const WEEKS = [
  {
    week: 1, title: 'WEEK 1', wingFrom: 0.45, wingTo: 0.6, target: 12, speed: 180, bats: false,
    tip: 'Your wings are still tiny, so you can only hop a little!',
    startLine: "LET'S PRACTICE, BRADLY! CATCH THE FIREFLIES!",
    doneLine: 'GREAT JOB, BRADLY!',
  },
  {
    week: 2, title: 'WEEK 2', wingFrom: 0.6, wingTo: 0.8, target: 16, speed: 200, bats: true, batFirst: 4, batGap: [3.2, 5],
    tip: "Watch out for the mean bats! Don't let them get to you.",
    startLine: 'YOUR WINGS ARE GETTING BIGGER!',
    doneLine: 'AMAZING! ONE MORE WEEK!',
  },
  {
    week: 3, title: 'WEEK 3!!', wingFrom: 0.8, wingTo: 1, target: 20, speed: 220, bats: true, batFirst: 3, batGap: [2.2, 3.6],
    tip: 'Almost there! Fly as high as you can!',
    startLine: 'ALMOST THERE, BRADLY!',
    doneLine: 'LOOK AT YOUR WINGS NOW!',
  },
];
