/* Speaking script, copied from "Do We Have a Sixth Sense? — Speaking Script".
   Each slide is split into segments; `step` = the click step during which you say it. */
window.SLIDE_TITLES = [
  "Title", "Only five?", "Love", "Intuition", "Extrasensory perception",
  "The verdict", "Back to Aristotle", "How many senses?",
  "Proprioception", "Balance", "Interoception", "Pain", "Temperature",
  "Conclusion", "Thank you"
];

window.NOTES = [
  /* 1 */ [
    { step: 0, text: "Good morning, everyone. Today I’d like to talk about something we all learnt at school: that human beings have five senses — sight, hearing, smell, taste and touch." }
  ],
  /* 2 */ [
    { step: 0, text: "This idea goes back more than two thousand years, to the Greek philosopher Aristotle." },
    { step: 1, text: "But is it actually true? Do we really have five senses and nothing more? Throughout history, many people have put forward the idea of a “sixth sense”. Today I’m going to look at three of the most popular candidates, and then at what science really has to say." }
  ],
  /* 3 */ [
    { step: 0, text: "Let’s start with the most romantic one: love. Many people claim that love is something science can’t explain — that when we fall in love, we perceive the world in a completely different way, almost as if we had an extra sense." },
    { step: 1, text: "And this idea is surprisingly old. In a museum in Paris there is a set of six tapestries, made around the year 1500, called The Lady and the Unicorn. Five of them represent the five senses. The sixth one is different: it simply says “À mon seul désir” — “to my only desire” — and it has often been interpreted as love. So, five hundred years ago, someone was already wondering whether love might be our sixth sense." },
    { step: 2, text: "However, when scientists study attraction, what they find is not a new sense, but the old ones working together. Our brain combines what we see, what we hear and even what we smell to decide how we feel about someone. In other words, love isn’t a sense — it’s what happens when all our senses and our brain work together." }
  ],
  /* 4 */ [
    { step: 0, text: "The second candidate is intuition — that “gut feeling” that tells us something is wrong, or what we should do, before we can explain why." },
    { step: 1, text: "Interestingly, scientists have actually managed to measure it. At the University of New South Wales, in Australia, researchers showed people emotional images so quickly that they couldn’t consciously see them. Even so, those hidden images helped participants make faster and more confident decisions." },
    { step: 2, text: "Another study found that the gut feelings of experienced financial traders were genuine physical signals from their bodies — and the most experienced traders performed best." },
    { step: 3, text: "So intuition is real — but it isn’t magic. It’s our brain processing information so fast that we aren’t even aware of it." }
  ],
  /* 5 */ [
    { step: 0, text: "The third one is the one we see most often in films: the ability to see ghosts, read minds or predict the future — what is known as extrasensory perception, or ESP. Many of you will remember the film The Sixth Sense, in which a little boy can see dead people." },
    { step: 1, text: "And plenty of real people claim to have this kind of gift; in Celtic tradition, it was even called “second sight”." },
    { step: 2, text: "Scientists have tested it. In the so-called Ganzfeld experiments, one person tried to “send” an image to another person in a different room, using only their mind. Some early results looked promising," },
    { step: 3, text: "but when other laboratories tried to repeat them, they couldn’t get the same results. To this day, there is no evidence accepted by the scientific community that ESP exists." }
  ],
  /* 6 */ [
    { step: 0, text: "So, what do these three have in common? None of them has enough evidence to be considered a separate sense. Love and intuition can be explained by our existing senses and our brain working together like a perfect machine, and ESP simply hasn’t passed the scientific tests." },
    { step: 1, text: "Does that mean Aristotle was right, and we only have five senses? Well… not exactly." }
  ],
  /* 7 */ [
    { step: 0, text: "Aristotle’s reasoning was simple: every sense needs an organ. We have eyes, ears, a nose, a tongue and skin — so, five senses. In fact, in his book On the Soul, he even tried to prove that a sixth sense could not exist." },
    { step: 1, text: "The problem is that some of our sense organs are hidden. For example, the organ that controls our balance is inside the inner ear, and scientists only understood its role in the early 1800s — more than two thousand years after Aristotle." }
  ],
  /* 8 */ [
    { step: 0, text: "So how many senses do we really have? This is where it gets surprising." },
    { step: 1, text: "Charles Spence, a neuroscientist at the University of Oxford, suggests that we have somewhere between 22 and 33 senses." },
    { step: 2, text: "Not every scientist agrees on the exact number — some argue that the question has no clear answer, because it depends on how you define a sense." },
    { step: 3, text: "But it is generally agreed that we have at least seven." },
    { step: 4, text: "The key point is this: these extra senses aren’t mysterious. They have real receptors in our bodies. They’re simply hidden inside us, and they work without us noticing. Let me show you five of them." }
  ],
  /* 9 — Proprioception */ [
    { step: 0, text: "First, proprioception: the sense that tells us where our body parts are without looking." },
    { step: 1, text: "It’s the reason you can touch your nose with your eyes closed." },
    { step: 2, text: "The term was coined by Sir Charles Sherrington, who won the Nobel Prize in 1932." },
    { step: 3, text: "Gymnasts and dancers depend on it every second." }
  ],
  /* 10 — Balance */ [
    { step: 0, text: "Second, our sense of balance, also called the vestibular sense." },
    { step: 1, text: "It’s a tiny, fluid-filled organ in our inner ear" },
    { step: 2, text: "that detects the movement of our head and the pull of gravity." },
    { step: 3, text: "We only really notice it when something goes wrong — for example, when we feel seasick." }
  ],
  /* 11 — Interoception */ [
    { step: 0, text: "Third, interoception: our ability to feel what’s happening inside our body — our heartbeat, our breathing, hunger and thirst." },
    { step: 1, text: "And here’s an interesting connection: people who are good at sensing their own heartbeat also tend to be more intuitive." },
    { step: 2, text: "So part of the “intuition” we talked about earlier may actually come from this sense." }
  ],
  /* 12 — Pain */ [
    { step: 0, text: "Fourth, pain, or nociception." },
    { step: 1, text: "It isn’t just a strong form of touch — it’s a separate sense." },
    { step: 2, text: "We know this because some people are born unable to feel pain, even though they can feel pressure and temperature perfectly well. As a result, they often suffer serious injuries." },
    { step: 3, text: "Pain may be unpleasant, but it protects us." }
  ],
  /* 13 — Temperature */ [
    { step: 0, text: "And fifth, thermoception: our sense of heat and cold." },
    { step: 1, text: "It’s what makes you pull your hand away from a hot pan before you’ve even had time to think." }
  ],
  /* 14 — Conclusion */ [
    { step: 0, text: "To conclude: is there a sixth sense? In the magical sense, I don’t think so." },
    { step: 1, text: "What we call a “sixth sense” is usually one of two things. Either it’s our brain combining information from our senses in an extraordinary way — like love or intuition —" },
    { step: 2, text: "or it’s one of the many real senses that we simply forgot to count, because they’re hidden inside us." },
    { step: 3, text: "Aristotle gave us five senses; science has given us more than twenty. And perhaps that’s the most amazing part: we don’t need a magical sixth sense, because the mind we already have is far more advanced than we usually think." }
  ],
  /* 15 — Thank you */ [
    { step: 0, text: "Thank you very much for listening. I’m happy to answer any questions." }
  ]
];
