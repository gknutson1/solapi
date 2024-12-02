import type {Base, Deck, DrawResponse, Card} from "./objects"
import {CardBack, CardFrame, Offset} from "./objects"

var id: string;

async function call<Type extends Base>(str: string, id?: string, query?: Record<string, any>): Promise<Type> {
    let url = "https://deckofcardsapi.com/api/deck";
    if (id) { url += '/' + id }
    url += str
    if (query) {url += "?" + new URLSearchParams(query)}

    function onFetch(data: Response): Promise<Base> {
        return data.json().then(onJson, x => onJsonError(x, data))
    }

    function onFetchError(err: any): any {
        console.error("Could not fetch \"" + url + "\" - received the following error: ", err)
    }

    function onJson(data: Type): Type {
        if (! ('success' in data) || ! data.success) {
            console.error("fetched and decoded \"" + url + "\" but parsed JSON response indicates failuer ir is malformed: ", data)
        } else {
            console.log("Request completed successfully", url, data)
        }
        return data
    }

    function onJsonError(err: any, data: Response): any {
        console.error("fetched \"" + url + "\" but encountered a JSON decoding error: ", err, "while decoding this data as JSON: ", data.body)
    }

    return fetch(url).then(onFetch, onFetchError)
}

async function setupTableau(id: number, resp: DrawResponse) {
    // @ts-ignore
    let base: HTMLElement = document.getElementById("tableau-" + id);
    // @ts-ignore
    let card: Card = resp.cards.pop()

    for(let i = 1; i < id; i++) {
        let element = document.createElement("img")
        element.setAttribute("src", CardBack)
        element.setAttribute("alt", "blank space")
        element.classList.add("tableau")
        element.style.position = "relative"
        if(i != 1) { element.classList.add("stacked") }

        //element.style.marginTop = `-${Offset * (i - 1) * 5}px`
        console.log(element)
        base.append(element)
    }
    // let element = document.createElement("img")
    // element.setAttribute("src", card.image)
    // element.setAttribute("class", "tableau")
    // element.setAttribute("alt", card.suit + " " + card.value)
    // console.log(element)
    // base.append(element)
}

async function setupDeck(deck: Deck) {
    id = deck.deck_id

    for (let i = 1; i <= 7; i++) {
        call<DrawResponse>("/draw", id, { "count": i }).then(res => setupTableau(i, res), null)
    }
}

async function genDeck() {
    call<Deck>("/new/shuffle").then(deck => setupDeck(deck))
}

export { genDeck };
