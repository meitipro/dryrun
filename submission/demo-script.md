# Silent demo, about ninety seconds

No voice. Every screen says what is happening, and the consensus waits are cut short with the transaction link left on screen. Record at 1280 x 800, one browser profile with a wallet on Studio Next and test GEN.

| Time | Screen | What the viewer sees |
|---|---|---|
| 0:00 | Landing, `/` | The terminal prints a real suite line by line: expected, label and a bracketed result per case, the bar, the colour and the bounty line |
| 0:10 | Rule sets, `/r#register` | A name and five rules are typed. **$ dryrun register** is pressed, then **$ dryrun fund** on the suite page: the pool shows 10 GEN |
| 0:22 | Add a case, `/r/<id>/add` | Five scenarios are added from the command line page, each with ALLOW or BLOCK toggled and **run it, 1 GEN** |
| 0:40 | Suite, `/r/<id>` | "validators reading ...", then the results fill in as `[PASS]` lines. The transaction link stays on screen |
| 0:58 | A gap | One case comes back `[UNCL]`, the bounty line shows 2 GEN to its author, and the suite goes AMBER |
| 1:12 | Fix and re-run | **$ dryrun update-rules** writes version 2, every case turns `[STALE]`, each runs again, and the suite goes GREEN |

Cut the waits, never the label: each result keeps its transaction link until the line is on screen. Do not edit any text on screen, and do not show a wallet seed or key.
