# Rad Rack

Dress your Rare Friend in 80s mall clothes. The Friend on stage is the canonical Generations bitmap — black pixels, not a redraw. Shutter shades, leg warmers, a windbreaker, a boombox and the rest sit on top.

**Builder:** Sharp ([@Sharpbigred](https://x.com/Sharpbigred))
**Category:** Character Spotlight
**Stack:** FriendSDK v0.1.2 (simulated economy)

One sentence: Rad Rack puts your hardwired Generations Friend in a neon fitting room and spends simulated $RAREFRIENDS on mall tokens that drop 80s looks.

## Play

Ownership-gated runtime (wallet on Robinhood mainnet, chain 4663, holding a Generations NFT of generation 1 or higher):

```sh
npm ci
npx friendsdk dev games/rad-rack --host 0.0.0.0 --port 4173
```

Open the printed URL. Connect a wallet, switch to Robinhood if asked, pick an owned Friend. Purchases and rewards are simulated. No transaction is sent.

This repo also embeds the same game in a browser mirror so a sample Friend (Hoverer #7730 or Skeleton #3412) can be dressed before a wallet is connected. Sample art is public and is not an ownership claim. The mirror starts each Friend with 20 simulated RF.

## Controls

- Tap a look to try it on. Dashed border means you do not own it yet.
- **Buy token** spends 1 RF (simulated) for one mall token.
- **Open token** rolls the table below and puts that look on your Friend.
- **Odds → Redeem** turns one owned copy back into simulated RF.
- **A / ←** walks left. **D / →** walks right. On-screen arrows do the same.
- Wear at least one look, then **The Floor** — or walk into the right-hand door — opens the club. The door stays shut with nothing on.
- In the club, five dancers move to **Cursor**, an original computer loop (square-wave arpeggios, triangle bass, a power-on chirp). Turn **Sound** on to hear it. **Dance** or **Space** cycles Bounce, Robot, Wave, and Freeze. Walk into the left door, or press **Back to the rack**, to leave. Clothes stay on.
- **1–9** and **0** toggle looks. **P** or **Pose** strikes a pose in the fitting room.
- **Sound** and **Motion** sit in the header. Motion follows the system reduced-motion setting until you override it.
- Loading and artwork errors have a retry. The runtime toolbar (wallet, Friend, confirmations) stays in the FriendSDK frame.

## Economy (simulated)

Consumable: **Mall token**. Price: **1 RF** (`1000000000000000000` base units).

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

Chances sum to 10000 bps. Expected redeem value is about 0.6835 RF per token, so opening is a simulated RF sink. Maximum prize is 8 RF. The preview ledger starts at 20 RF. Session only — the sandbox has no save.

Try-on is free and session-local. Ownership (what you can redeem) comes only from opening tokens. Live contracts are not wired; a future cut would keep this table and confirm spends through the FriendSDK host.

## Credits

- Character art: canonical Rare Friends Generations sprites via FriendSDK `createFriendReader` / pinned registry. Sample frames for #7730 and #3412 are the SDK's published bitmap fixtures (block 66188037) and are only a fallback if the chain read fails.
- SDK: [@rarefriends/friendsdk](https://github.com/spokesz/friendsdk) v0.1.2, Apache-2.0. See FriendSDK `NOTICE.md` for artwork provenance.
- No third-party illustration packs. Clothes are pixel overlays drawn for this game.

## Checks

- `npx friendsdk check games/rad-rack`
- App `npm run typecheck` and `npm run build`
- Browser pass on desktop and a phone-width layout: load a Friend, try on shades, buy and open one simulated token, walk with A and D.

## Known issues

- Wallet discovery needs a browser wallet on Robinhood mainnet. The in-page mirror still dresses sample or pasted token ids when no wallet is injected.
- Owned-Friend listing depends on the public Robinhood RPC returning owner-filtered transfer history. If that call fails, paste a token id or use a sample.
- Try-on is not an on-chain cosmetic. There is no save, no trading, and no live RF transfer in this build.
- Portrait host layout is `host.css` (`560px`, `3 / 4`). Restart the FriendSDK dev runner once after adding that file.
- Club music is an original computer loop synthesized in the browser. It is not a licensed track or a game-theme port, and it stays silent until Sound is on.
