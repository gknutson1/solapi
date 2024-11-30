const base = "https://deckofcardsapi.com/api/deck";
const card_back = "https://deckofcardsapi.com/static/img/back.png"

interface Deck {
    success: boolean;
    deck_id: string;
    shuffled: boolean;
    remaining: number;
}



async function getJson(str: string): Promise<any> {
    return fetch(str).then(
        res =>
            res.json().then(
                null,
                _ => console.error("fetched \"" + str + "\" but could not resolve following data as json: " + res.body, res)
            ),
        res =>
            console.error("could not fetch " + res.url, res)
    )
}

async function genDeck(): Promise<Deck> {
    return getJson(base + "/new/draw/?count=52")
}

export { genDeck, card_back };
