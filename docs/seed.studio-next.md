# Seed

Written by `python scripts/seed.py` against the Dryrun contract [`0x7e18514fF9D907b48d7e9588B02F188320E48DFa`](https://explorer-studio-dev.genlayer.com/address/0x7e18514fF9D907b48d7e9588B02F188320E48DFa) on Studio Next. Every label below was produced by the deployed judge through real consensus, and the script recorded what the contract said, not what was hoped.

The communities and the people are fictional and exist only for this demonstration. The accounts are test accounts. The age suite is red on purpose: its author predicts ALLOW for a 17 year old under a rule that clearly forbids it.

## Rule sets

| Rule set | Name | Version | Suite | Pass | Unclear | Fail | Stale | Pool | Bounties paid |
|---|---|---|---|---|---|---|---|---|---|
| 7 | Seed: member conduct | 1 | **GREEN** | 3 | 0 | 0 | 0 | 10.0 GEN | 0.0 GEN |
| 9 | Seed: promotion | 2 | **GREEN** | 3 | 0 | 0 | 0 | 8.0 GEN | 2.0 GEN |
| 10 | Seed: tone | 1 | **AMBER** | 2 | 1 | 0 | 0 | 8.0 GEN | 2.0 GEN |
| 11 | Seed: age | 1 | **RED** | 1 | 0 | 1 | 0 | 10.0 GEN | 0.0 GEN |

## Cases

| Rule set | Case | Scenario | Expected | Label | Result | Bounty |
|---|---|---|---|---|---|---|
| 7 | 13 | Someone aged 17 asks to join | BLOCK | BLOCK | PASS | 0.0 GEN |
| 7 | 14 | A member asks a question about gas fees | ALLOW | ALLOW | PASS | 0.0 GEN |
| 7 | 16 | A member posts the same advert for their token in ten channels | BLOCK | BLOCK | PASS | 0.0 GEN |
| 7 | 18 | A member posts spam in a direct message | BLOCK | - | RETIRED | 0.0 GEN |
| 9 | 19 | A member posts an ad for their own token in the main channel | BLOCK | BLOCK | PASS | 0.0 GEN |
| 9 | 20 | A member shares a podcast they appeared on in the main channel | BLOCK | BLOCK | PASS | 2.0 GEN |
| 9 | 21 | A member asks about gas fees in the main channel | ALLOW | ALLOW | PASS | 0.0 GEN |
| 10 | 22 | A member calls another member an idiot in the main channel | BLOCK | BLOCK | PASS | 0.0 GEN |
| 10 | 23 | A member replies to a newcomer with a sarcastic remark | BLOCK | UNCLEAR | UNCLEAR | 2.0 GEN |
| 10 | 24 | A member thanks another member for their help | ALLOW | ALLOW | PASS | 0.0 GEN |
| 11 | 25 | Someone aged 25 asks to join | ALLOW | ALLOW | PASS | 0.0 GEN |
| 11 | 26 | Someone aged 17 asks to join | ALLOW | BLOCK | FAIL | 0.0 GEN |

## Money

- conduct:fund: [0x426b4410…](https://explorer-studio-dev.genlayer.com/tx/0x426b4410b4d9d5b9b6340536fdc910fe325666c2d2cff9b2a26b7f7ae3825f20) (the bounty pool)
- promo:fund: [0x7c4d159c…](https://explorer-studio-dev.genlayer.com/tx/0x7c4d159cd5a9c613e6a526cf61f5a84b1fd7f855c50e831a568cf4a307474af2) (the bounty pool)
- tone:fund: [0xfcde20f6…](https://explorer-studio-dev.genlayer.com/tx/0xfcde20f6d8c012f2f01ee15e53589e3b886a0043af2a3ff89941a4fe2003ca5e) (the bounty pool)
- age:fund: [0x6e5df1f7…](https://explorer-studio-dev.genlayer.com/tx/0x6e5df1f7347ad82a77c16278bf335b80d39a1406ed0702f2974665a619948b66) (the bounty pool)
- ana:withdraw: [0xe661413e…](https://explorer-studio-dev.genlayer.com/tx/0xe661413e8a0fb93d85b7650044298027df4ec5dde3dee7ad9166be4a18237168) (stakes that came back and bounties earned)
- ben:withdraw: [0xe96eec3d…](https://explorer-studio-dev.genlayer.com/tx/0xe96eec3d50d4d5424b2757bcd2fef1c33f1f5a313de66e8c58895ffaa53de59a) (stakes that came back and bounties earned)
- cam:withdraw: [0x33f514e7…](https://explorer-studio-dev.genlayer.com/tx/0x33f514e7ab2d9c395eff3f0ce5c893c569a38cb32d7df6746595e9e50173a251) (stakes that came back and bounties earned)

## Every step

- `conduct:register` register_rules ok [0x8a55e95a…](https://explorer-studio-dev.genlayer.com/tx/0x8a55e95ab3016594e505bb934da56c1b926f6253e523a23076cad70ef839cce0) 2026-11-23T15:46:29Z
- `conduct:fund` fund_pool ok [0x426b4410…](https://explorer-studio-dev.genlayer.com/tx/0x426b4410b4d9d5b9b6340536fdc910fe325666c2d2cff9b2a26b7f7ae3825f20) 2026-11-23T15:46:37Z
- `conduct:add1` add_case ok [0xacdb9d2c…](https://explorer-studio-dev.genlayer.com/tx/0xacdb9d2c25f5aae0509454386908247d3ef03da0ca4df0a974436aabb97ed89f) 2026-11-23T15:46:46Z
- `conduct:add2` add_case ok [0x8993dbde…](https://explorer-studio-dev.genlayer.com/tx/0x8993dbde749e8bc5cb0d082c5931a83f36224444b427b1096fe8dfcf11aeeedf) 2026-11-23T15:46:54Z
- `conduct:add3` add_case ok [0x3e6ae645…](https://explorer-studio-dev.genlayer.com/tx/0x3e6ae6455549df0bffe521b1a5abf0a5a5020d3cba4fb65be301cce0370cec5b) 2026-11-23T15:47:12Z
- `conduct:run1` run ok [0x1f3c3c33…](https://explorer-studio-dev.genlayer.com/tx/0x1f3c3c33e15f5ab5a76cf822fe9171dcd31d3273a3b3ab16e04b8bf9bbf9ef42) 2026-11-23T15:48:55Z
- `conduct:run2` run ok [0xde290da6…](https://explorer-studio-dev.genlayer.com/tx/0xde290da6dc5e81a51fa54fca30dcfa1ff7b129cb4a0d8e17e74a30a31ea8d961) 2026-11-23T15:49:41Z
- `conduct:run3` run ok [0xc1352323…](https://explorer-studio-dev.genlayer.com/tx/0xc1352323044c5ab70ac97f1bcff62551e23d5d80ca3ca153cc28b620ecc2b56c) 2026-11-23T15:50:43Z
- `conduct:add_extra` add_case ok [0x1ea2f66d…](https://explorer-studio-dev.genlayer.com/tx/0x1ea2f66dc12f3253f6835736566c7e18bbb96267b41433e0b3c3c7c44f75be5d) 2026-11-23T15:50:59Z
- `conduct:retire_extra` retire_case ok [0x9b96f908…](https://explorer-studio-dev.genlayer.com/tx/0x9b96f908f8ba13f967ed25a74e1cb0ab06b4776bc4b06234b2c87630b3738684) 2026-11-23T15:51:07Z
- `promo:register` register_rules ok [0xf21a2e68…](https://explorer-studio-dev.genlayer.com/tx/0xf21a2e680a3e4b58e2f3501503a9642906f632a31fcfc45a32b595fb57ff1abe) 2026-11-23T15:51:27Z
- `promo:fund` fund_pool ok [0x7c4d159c…](https://explorer-studio-dev.genlayer.com/tx/0x7c4d159cd5a9c613e6a526cf61f5a84b1fd7f855c50e831a568cf4a307474af2) 2026-11-23T15:51:36Z
- `promo:add1` add_case ok [0x58fa8ad0…](https://explorer-studio-dev.genlayer.com/tx/0x58fa8ad0875f6bc31d79ada01c78bb607e8a869c1ab07f2955cdcafe05633fc1) 2026-11-23T15:51:44Z
- `promo:add2` add_case ok [0x38f6fe1d…](https://explorer-studio-dev.genlayer.com/tx/0x38f6fe1d6ce3e90b43723193a52825ed0a4890f289ee3e83f16aef6987fe7150) 2026-11-23T15:51:54Z
- `promo:add3` add_case ok [0xc675656c…](https://explorer-studio-dev.genlayer.com/tx/0xc675656c2771e41d633ee71dbca461648c01b021661b59b52307c3f027519e6a) 2026-11-23T15:52:02Z
- `promo:run1` run ok [0xf3990ac2…](https://explorer-studio-dev.genlayer.com/tx/0xf3990ac2ab225ac557748aea54ca338d5df54ae9baffd967bd6c2269edfd1313) 2026-11-23T15:52:21Z
- `promo:run2` run ok [0x21e746ea…](https://explorer-studio-dev.genlayer.com/tx/0x21e746ea82ebebb37e0f7b71cf7752d94a3f36a0d445ee5655e34303ba2aab25) 2026-11-23T15:52:55Z
- `promo:run3` run ok [0x7cb7bf2c…](https://explorer-studio-dev.genlayer.com/tx/0x7cb7bf2c84d05bebb734cdfa1038baed08d376091a9f3c62c2786226f3ceceb8) 2026-11-23T15:53:08Z
- `promo:update` update_rules ok [0x9f6d5d7f…](https://explorer-studio-dev.genlayer.com/tx/0x9f6d5d7f3f56918256a77b0a459259fcc814fd85f1809cde7682ea1b4b7a7668) 2026-11-23T15:53:21Z
- `promo:rerun1` run ok [0xbc560b0a…](https://explorer-studio-dev.genlayer.com/tx/0xbc560b0ae8c65e8818e582dcc7bebddb632c2f395e41da2ee69777d695c855fa) 2026-11-23T15:55:03Z
- `promo:rerun2` run ok [0xffec9404…](https://explorer-studio-dev.genlayer.com/tx/0xffec9404078dbcce13e38fb2347f5cd681b67fddccd2bac8ea628700357ebc1f) 2026-11-23T15:55:21Z
- `promo:rerun3` run ok [0x60b79070…](https://explorer-studio-dev.genlayer.com/tx/0x60b7907025ad2f2d3458914cddb8e8d285615c1a9a04a6fa11a2f12985db272a) 2026-11-23T15:55:41Z
- `tone:register` register_rules ok [0x2414b22a…](https://explorer-studio-dev.genlayer.com/tx/0x2414b22a379cbf6ad02bd06c26a5b0b516049fdd0d7062cdab125d57725df09a) 2026-11-23T15:55:51Z
- `tone:fund` fund_pool ok [0xfcde20f6…](https://explorer-studio-dev.genlayer.com/tx/0xfcde20f6d8c012f2f01ee15e53589e3b886a0043af2a3ff89941a4fe2003ca5e) 2026-11-23T15:56:05Z
- `tone:add1` add_case ok [0x0458b8f1…](https://explorer-studio-dev.genlayer.com/tx/0x0458b8f1f5f54ecb794b9bb3d01942a2853ebd29bea0fc7e04963ffdd2e3196c) 2026-11-23T15:56:12Z
- `tone:add2` add_case ok [0x51877be6…](https://explorer-studio-dev.genlayer.com/tx/0x51877be6db8c2e4bfc0337a8d17c7af481496fbb0b060ec2287e966a827fb100) 2026-11-23T15:56:20Z
- `tone:add3` add_case ok [0x27e4b56d…](https://explorer-studio-dev.genlayer.com/tx/0x27e4b56de69562b5f74743d6d8ac4006e4f16b12953b17be42414fdb2c2958e7) 2026-11-23T15:56:29Z
- `tone:run1` run ok [0x7243ffd5…](https://explorer-studio-dev.genlayer.com/tx/0x7243ffd5f636a0c200f2c6df86e0502155d8b405ac30a3d324d40f93b1a51f91) 2026-11-23T15:56:47Z
- `tone:run2` run ok [0x5b1fa42d…](https://explorer-studio-dev.genlayer.com/tx/0x5b1fa42dd52bb75b75e2faba03d09576963eb4b247c1d508772bf73c24341b4d) 2026-11-23T15:57:06Z
- `tone:run3` run ok [0x70c0f6d5…](https://explorer-studio-dev.genlayer.com/tx/0x70c0f6d50744f80b32e4ebc267f0356009917964943c2eba4c53893c2e441930) 2026-11-23T15:57:25Z
- `age:register` register_rules ok [0xedcb14e7…](https://explorer-studio-dev.genlayer.com/tx/0xedcb14e76fabe142402d18357df81466ebb9e49601a1c5ca82028b0e99a04ee7) 2026-11-23T15:57:37Z
- `age:fund` fund_pool ok [0x6e5df1f7…](https://explorer-studio-dev.genlayer.com/tx/0x6e5df1f7347ad82a77c16278bf335b80d39a1406ed0702f2974665a619948b66) 2026-11-23T15:57:47Z
- `age:add1` add_case ok [0xe659b4aa…](https://explorer-studio-dev.genlayer.com/tx/0xe659b4aa0a98e8c2236d8f0123548c92f7607f71ba0e6ecc3c787bb7951c4601) 2026-11-23T15:57:56Z
- `age:add2` add_case ok [0x8d584bd6…](https://explorer-studio-dev.genlayer.com/tx/0x8d584bd6417b3f09d3d360e022c9afe4975d6441c4eb9a2d0d7fd31830b3e495) 2026-11-23T15:58:04Z
- `age:run1` run ok [0xb20fe359…](https://explorer-studio-dev.genlayer.com/tx/0xb20fe3597644e5b5c97fdfac4aaf4a856a40b320e9f696eb02f4125d41522117) 2026-11-23T15:58:53Z
- `age:run2` run ok [0xfb1a71f1…](https://explorer-studio-dev.genlayer.com/tx/0xfb1a71f143b8fe775b3f443ce7f3864431ba2df9d0e1e7facca80aa9e48c88a9) 2026-11-23T15:59:12Z
- `ana:withdraw` withdraw ok [0xe661413e…](https://explorer-studio-dev.genlayer.com/tx/0xe661413e8a0fb93d85b7650044298027df4ec5dde3dee7ad9166be4a18237168) 2026-11-23T15:59:23Z
- `ben:withdraw` withdraw ok [0xe96eec3d…](https://explorer-studio-dev.genlayer.com/tx/0xe96eec3d50d4d5424b2757bcd2fef1c33f1f5a313de66e8c58895ffaa53de59a) 2026-11-23T15:59:31Z
- `cam:withdraw` withdraw ok [0x33f514e7…](https://explorer-studio-dev.genlayer.com/tx/0x33f514e7ab2d9c395eff3f0ce5c893c569a38cb32d7df6746595e9e50173a251) 2026-11-23T15:59:40Z
