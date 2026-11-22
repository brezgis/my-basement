# Assets added by banya (The Tea Room, The Banya, The Parnaya, The Treatment Room)

Pictures (new, made with `tools/art.py`, in `site/assets/art/`):

| file | what | source | licence |
|---|---|---|---|
| `kustodiev_merchant_wife_tea.jpg` | Boris Kustodiev, *Merchant's Wife at Tea*, 1918, oil on canvas; State Russian Museum, St Petersburg | Wikimedia Commons (Google Art Project), https://commons.wikimedia.org/wiki/File:Boris_Kustodiev_-_Merchant%27s_Wife_at_Tea_-_Google_Art_Project.jpg | Public domain (the artist died in 1927) |
| `serov_girl_with_peaches.jpg` | Valentin Serov, *Girl with Peaches (Portrait of Vera Mamontova)*, 1887, oil on canvas; State Tretyakov Gallery, Moscow | Wikimedia Commons (Google Art Project), https://commons.wikimedia.org/wiki/File:Valentin_Serov_-_%D0%94%D0%B5%D0%B2%D0%BE%D1%87%D0%BA%D0%B0_%D1%81_%D0%BF%D0%B5%D1%80%D1%81%D0%B8%D0%BA%D0%B0%D0%BC%D0%B8._%D0%9F%D0%BE%D1%80%D1%82%D1%80%D0%B5%D1%82_%D0%92.%D0%A1.%D0%9C%D0%B0%D0%BC%D0%BE%D0%BD%D1%82%D0%BE%D0%B2%D0%BE%D0%B9_-_Google_Art_Project.jpg | Public domain (the artist died in 1911) |
| `kustodiev_russian_venus.jpg` | Boris Kustodiev, *Russian Venus*, 1925-26, oil on canvas; Nizhny Novgorod State Art Museum | Wikimedia Commons, https://commons.wikimedia.org/wiki/File:Kustodiev_russian_venus.jpg | Public domain (the artist died in 1927) |

Copied from Anna's House (`~/projects/my_house/site/assets/art/`, same names, with their manifest entries), and hung in the banya's rooms:
- `hokusai_great_wave.jpg`: Katsushika Hokusai, *Under the Wave off Kanagawa*, 1830/33; Art Institute of Chicago, https://www.artic.edu/artworks/24645; public domain (CC0).
- `cassatt_childs_bath.jpg`: Mary Cassatt, *The Child's Bath*, 1893; Art Institute of Chicago, https://www.artic.edu/artworks/111442; public domain (CC0).
- `monet_wheatstacks.jpg`: Claude Monet, *Stacks of Wheat (End of Summer)*, 1890-91; Art Institute of Chicago, https://www.artic.edu/artworks/64818; public domain (CC0).

Also copied from Anna's House (`~/projects/my_house/site/assets/art/`, same name), then left unused by this file after the
change of style (another agent's `up_west.js` hangs it, so it stays): `shishkin_morning_pine_forest.jpg`, Ivan Shishkin
and Konstantin Savitsky, *Morning in a Pine Forest*, 1889, https://commons.wikimedia.org/wiki/File:Shishkin,_Ivan_-_Morning_in_a_Pine_Forest.jpg,
public domain.

(Four more pictures were fetched or copied for the first, period-style version of the rooms, two eighteenth-century
lubok woodcuts from Wikimedia Commons, Savrasov's *The Rooks Have Come Back* and a lubok of birds of paradise, and
removed again with their manifest entries when the style changed.)

Code borrowed (credited in the files' headers): `banya_fx.js`'s candle flames and steam are `pool_chapel_fx.js`'s (the
flame's fragment shader is `site/src/flame.js`'s); `banya_parts.js`'s leaves, palms and ferns are grown as Frond grows
them on Vesper Street (`~/projects/town_walk/site/src/shops/plants.js`), by way of `pool_chapel_parts.js`.

No textures. One shared model placed (`mossy_rock_03`, from `notes/ASSETS.md`). About 0.9 MB of new pictures (three JPEGs).

Code copied: `banya_nails_parts.js`, `banya_nails_fx.js` and `banya_nails_text.js` are cut down from the shelved Nail Salon's `furnish/shelved/salon_parts.js`, `salon_fx.js` and `salon_text.js` (agent `salon`): the throne, basin, stool, gel lamp, polish, the glittering bottles and the bell. The СПАНЬЯ board (`banya_sign.js`) is drawn stroke by stroke; no font.
