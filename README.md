# Glow in the pie (π)
S5 Stam, JOTA-JOTI 2017 bosspel dashboard.

### Device support
- Developed on node 8.5.x, so keep that in mind.
- Developed with browser focus of "Chrome" and "Chrome mobile".
- You need a password to use the application. I won't give the current one :) But you can change the hash in the following line: [./libs/password.js#L9](https://github.com/Brutusn/GlowInThePie/blob/efae9555268baf88d81ac3300d4e4ca9d1509733/libs/password.js#L9)

### Running the application:
1. git clone/fork/download (whatever, get it on your system).
1. npm install
1. npm run app
1. Navigate to <server>:8080

## Game rules.
#### Location:
Best location for this game is a forest, but a normal field might be just as good.

#### Necessities:
- Items for take from station to station. (Glowsticks, for extra glow effect!)
- Chairs, to be able to relax on a station.
- Plenty of the above to occupy 4 stations.

#### Rules:
The players from team 1 (smugglers) will bring items from the A all the way to the last station [D]. See graphic below:

[A] -- A item --> [B] -- B item --> [C] -- C item --> [D]

If a player, from team 1, arrives at a station he has two options:
1. To hand in the object he's got, and collect points for his team. This is the only option at the last station [D].
1. To trade the object he's got, and to be able to collect more points at the next station.

Meanwhile team 2 (police) is able to catch the players from team 1. The caught person has to give away the item(s) he is currently carrying. The points of the item now goes to team 2 that captured it. Team 2 can't go to the stations to collect more points, but they are able to go to any station to collect points for their team.

The point system is as following:

Items | Team 1 (smugglers) | Team 2 (police)
----- | ------------------ | ---------------
Item A | 1 | 9
Item B | 5 | 5
Item C | 9 | 1

Now it's up to both teams to have the best strategy!

#### App usage:
This app has 3 pages:

1. Dashboard: Live statistics about the current selected game (Note 1: only for big screens (1080p), Note 2: To select a game, go first to page 3 (stations)).
1. Configuration: Set up and start new games.
1. Station: each station should select the active game. After that he can give (or take) points to the teams.

First create a game. After that log into the game and start it!
