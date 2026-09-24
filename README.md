# Rad Rack

Dress your Rare Friend in 80s mall clothes, then take them to the dance floor, the roller rink, and a photo booth.

**Builder:** Sharp ([@Sharpbigred](https://x.com/Sharpbigred))
**Category:** Character Spotlight
**Stack:** FriendSDK v0.1.2, simulated economy

One sentence: Rad Rack puts a hardwired Generations Friend on an 80s mall night and spends simulated $RAREFRIENDS on clothes, skates, masks, and mall tokens.

## Playable preview

https://stevereynolds2006-ship-it.github.io/rad-rack/

Connect a wallet on Robinhood mainnet (chain 4663) that holds a hardwired Rare Friends Generations NFT, generation 1 or higher. Purchases and rewards are simulated. No transaction is sent.

## Source

This repository. Game files are in `games/rad-rack`.

```sh
git clone https://github.com/spokesz/friendsdk.git
cd friendsdk
npm ci
rm -rf games/rad-rack
git clone https://github.com/stevereynolds2006-ship-it/rad-rack.git /tmp/rad-rack-src
cp -a /tmp/rad-rack-src/games/rad-rack games/rad-rack
npx friendsdk check games/rad-rack
npx friendsdk dev games/rad-rack --host 0.0.0.0 --port 4173
```

Open the printed URL. The public preview is the output of `npx friendsdk build games/rad-rack`, hosted from the `gh-pages` branch.

## How to play

- The Friend on stage is the canonical Generations bitmap. Clothes, skates, and masks are overlays.
- Tap the floor to walk. **Dance** on the right goes to the club once a look is on. **Rink** on the left goes to the roller rink. **Yours** on the desk opens the closet.
- **Buy token** spends 1 simulated RF for one mall token. **Open token** rolls the table below and puts that look on. Putting a look on zooms in, then returns to normal size.
- In the club, tap to move. Dancers follow your move. **Dance** cycles the move. Sound starts muted.
- On the rink, buy skates with simulated RF. A weekly rare pair rotates every 7 days. After 6 laps the floor cracks and you fall into an underground room.
- The underground lights cannot all be turned off. Each switch flips two lights, and one starts on. **Leave · 3 tokens** spends 3 mall tokens and returns to the wardrobe.
- The **Pictures** booth on the rink opens the photo booth. Buy a mask, including one weekly rare mask, then tap the room. Your Friend zooms in and the picture projects on the floor in front of them. The picture is also saved in the closet. Open **Yours** in the wardrobe and tap **View**.

## Economy (simulated)

Consumable: **Mall token**. Price: **1 RF**.

| Look | Chance | Redeem |
| --- | --- | --- |
| Sweatband | 18% | 0.25 RF |
| Fingerless gloves | 16% | 0.30 RF |
| Leg warmers | 15% | 0.35 RF |
| Shutter shades | 14% | 0.50 RF |
| Walkman phones | 12% | 0.70 RF |
| Neon windbreaker | 10% | 1 RF |
| Parachute pants | 8% | 1.20 RF |
| Boombox | 5% | 2 RF |
| Members jacket | 1.8% | 4 RF |
| Lightning earring | 0.2% | 8 RF |

Expected redeem value is about 0.6835 RF per token. Maximum prize is 8 RF. The preview ledger starts at 20 RF.

Skates and masks spend simulated RF from that same balance (local session ledger, not a second on-chain token). The weekly rare skate and weekly rare mask cost 8–10 RF and change every 7 days. Leaving the underground room plays and settles 3 mall tokens. Changing the tape spends 1 mall token. Nothing here sends a transaction.

## Credits

- Character art: canonical Rare Friends Generations sprites via FriendSDK. Sample frames are SDK fixtures and are not an ownership claim.
- SDK: [@rarefriends/friendsdk](https://github.com/spokesz/friendsdk) v0.1.2, Apache-2.0. See FriendSDK `NOTICE.md`.
- Room art, clothes, skates, masks, and the computer-music loops were made for this game. No third-party illustration packs or licensed songs.

## Checks

- `npx friendsdk check games/rad-rack` — valid. Expected reward `683500000000000000`. Maximum prize `8000000000000000000` base units.
- `npx friendsdk build games/rad-rack` — writes `games/rad-rack/.friendsdk/`.
- App typecheck passed on the game sources before this publish.

## Known issues

- Play needs a browser wallet on Robinhood mainnet and a generation-1-or-higher Generations NFT. The public preview does not include the mock wallet used by automated tests.
- The sandbox cannot save. Closet pictures, worn looks, skates, and masks last for the session only.
- Skate and mask prices are subtracted from the simulated RF balance in the game session. They do not call the chance-game `buy` action. The 3-token exit does call `play` and `settle`.
- The underground light puzzle is intentionally impossible.
- Owned-Friend listing depends on the public Robinhood RPC. If it fails, the runtime reports the error.
