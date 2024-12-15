import type {Base, Deck, DrawResponse, Card} from "./objects"
import {CardBack, CardFrame, Offset} from "./objects"

var id: string;

class Lock {
    count = 0
    inactive = "Ready"
    active = "Please Wait"

    release() {
        if (this.count > 0) { this.count--; }
        if (this.count <= 0) { // @ts-ignore
            document.querySelector(".status").textContent = this.inactive
        }
    }

    take() {
        this.count++
        if (this.count > 0) { // @ts-ignore
            document.querySelector(".status").textContent = this.active
        }
    }
}

const lock = new Lock()

async function call<Type extends Base>(str: string, id?: string, query?: Record<string, any>): Promise<Type> {
    let url = "https://deckofcardsapi.com/api/deck";
    if (id) { url += '/' + id }
    url += str
    if (query) {url += "?" + new URLSearchParams(query)}

    function onFetch(data: Response): Promise<Base> {
        lock.release()
        return data.json().then(onJson, x => onJsonError(x, data))
    }

    function onFetchError(err: any): any {
        lock.release()
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

    lock.take()
    return fetch(url).then(onFetch, onFetchError)
}

async function setupTableau(id: number, resp: DrawResponse) {
    // @ts-ignore
    let base: HTMLElement = document.getElementById("tableau-" + id);
    // @ts-ignore
    let card: Card = resp.cards.pop()

    let cont = document.createElement("div");
    cont.classList.add("stack-positioner")

    let img = document.createElement("img")
    img.setAttribute("alt", "back of card")
    img.classList.add("stacked")

    for(let i = 1; i < id; i++) {

        // @ts-ignore
        let activeCont: HTMLElement = cont.cloneNode()

        // @ts-ignore
        let activeImg: HTMLElement = img.cloneNode()
        activeImg.setAttribute("src", resp.cards[i - 1].image)

        activeCont.append(activeImg)
        base.append(activeCont)
    }

    img.setAttribute("src", card.image)
    img.setAttribute("alt", card.suit + " " + card.value)

    cont.append(img)
    base.append(cont)
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

async function load() {
    // @ts-ignore
    document.querySelector(".start").addEventListener("click", () => { genDeck(); });

    // @ts-ignore
    document.querySelector(".reset").addEventListener("click", () => { location.reload() ; });
}

export { load }
