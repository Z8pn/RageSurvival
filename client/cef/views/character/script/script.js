"use strict";
let item_pdw = {
    name: "combatpdw",
    width: 4,
    height: 2
};

let item_hatchet = {
    name: "hatchet",
    width: 2,
    height: 4
};

let item_parachute = {
    name: "parachute",
    width: 2,
    height: 3
};

let Inventory = {
    selector: $("#inventory"),
    width: null,
    slots: null,

    Generate: function(slots) {
        for (let i = 0; i < slots; i++) {
            Inventory.selector.append('<div class="slot"></div>');
        }
        Inventory.slots = slots;
        Inventory.width = $('#inventory').css('grid-template-columns').split(' ').length;
    },

    SetItem: function(item, x, y, flip = false) {
        let width = item.width;
        let height = item.height;

        if (flip) {
            width = item.height;
            height = item.width;
        }

        if (Inventory.IsFree(x, y, width, height)) {
            for (let i = x; i < x + width; i++) {
                for (let j = y; j < y + height; j++) {
                    Inventory.selector.children().eq(Inventory.GetIndex(i, j)).addClass('used');
                }
            }

            let html = '<div class="item item' + width + 'x' + height + '">'
                + '<img src="../../source/img/' + item.name + '.png"' + (flip ? ' class="flipped"' : '') + '>'
                + '</div>';


            Inventory.selector.children().eq(Inventory.GetIndex(x, y)).append($(html)
                .data('width', width)
                .data('height', height)
                .data('x', x)
                .data('y', y));
        } else {
            // hinweis
            return false;
        }
    },

    AddItem: function(item) {
        let width = item.width;
        let height = item.height;

        for(let i = 0; i < Inventory.slots; i++) {
            let coords = Inventory.GetCoords(i);
            if(Inventory.IsFree(coords.x, coords.y, width, height)) {
                Inventory.SetItem(item, coords.x, coords.y);
                return {
                    x: coords.x,
                    y: coords.y
                };
            }
        }
        return false;
    },

    FillSlot: function(x, y, width, height, isDragged) {
        for (let i = x; i < x + width; i++)
            for (let j = y; j < y + height; j++)
                Inventory.selector.children().eq(Inventory.GetIndex(i, j)).addClass(isDragged ? 'used-drag' : 'used');
    },

    ClearSlot: function(x, y, width, height, isDragged) {
        for (let i = x; i < x + width; i++)
            for (let j = y; j < y + height; j++)
                Inventory.selector.children().eq(Inventory.GetIndex(i, j)).removeClass(isDragged ? 'used-drag' : 'used');
    },

    IsFree: function(x, y, width, height) {
        for (let i = x; i < x + width; i++)
            for (let j = y; j < y + height; j++)
                if (Inventory.selector.children().eq(Inventory.GetIndex(i, j)).hasClass('used') || Inventory.GetIndex(i, j) >= Inventory.slots)
                    return false;
        return (x + width <= Inventory.width);
    },

    GetIndex: function(x, y) {
        return y * Inventory.width + x;
    },

    GetCoords: function(index) {
        let rowPos = Math.floor(index / Inventory.width);
        let colPos = index % Inventory.width;
        return {
            x: colPos,
            y: rowPos
        };
    },

    GetOffset: function(originX, originY, x, y) {
        return {
            x: x - originX,
            y: y - originY
        };
    }
};

let offset = { x: 0, y: 0 };
function ItemDropEvent(event, ui) {
    ui.helper.data('dropped', true);

    let target = $(event.target);

    let index = Inventory.selector.children().index(target);
    let coords = Inventory.GetCoords(index);
    index = Inventory.GetIndex(coords.x - offset.x, coords.y - offset.y);
    coords = Inventory.GetCoords(index);

    let width = ui.draggable.data('width');
    let height = ui.draggable.data('height');

    ui.draggable.css({
        left: 0,
        top: 0
    });

    if(coords.x + width > Inventory.width || coords.x < 0 || coords.y < 0 || !Inventory.IsFree(coords.x - offset.x, coords.y - offset.y, width, height)) {
        console.log(event.target);
        return;
    }

    console.log(coords.x);

    ui.draggable.detach().appendTo("#inventory > div:nth-child(" + (index+1) + ")");

    Inventory.ClearSlot(ui.draggable.data('x'), ui.draggable.data('y'), width, height);

    ui.draggable.data('x', coords.x);
    ui.draggable.data('y', coords.y);

    Inventory.FillSlot(coords.x, coords.y, width, height);
}

function ItemDragEvent(event, ui) {

}

$(function() {
    Inventory.Generate(122);
    Inventory.AddItem(item_pdw);
    Inventory.AddItem(item_parachute);
    // Wird nicht angezeigt. IsFree ist false
    Inventory.AddItem(item_hatchet);

    let lastCoords = null;
    let width, height;

    let first = true;

    $(".item").draggable({
        start: function(event, ui) {
            ui.helper.data('dropped', false);
            width = $(event.target).data('width');
            height = $(event.target).data('height');

            $(event.target).css({
                pointerEvents: 'none'
            });

            let lastSlot = -1;
            lastCoords = {
                x: $(event.target).data('x'),
                y: $(event.target).data('y')
            };

            Inventory.selector.children().index($(event.target));

            Inventory.ClearSlot(lastCoords.x - offset.x, lastCoords.y - offset.y, width, height);

            $('.slot').mousemove(function(e) {
                let index = Inventory.selector.children().index($(e.target));
                if(first) {
                    let offsetCoords = Inventory.GetCoords(index);
                    offset = Inventory.GetOffset(lastCoords.x, lastCoords.y, offsetCoords.x, offsetCoords.y);
                    first = false;
                }
                if(index === lastSlot)
                    return;

                Inventory.ClearSlot(lastCoords.x - offset.x, lastCoords.y - offset.y, width, height, true);
                let coords = Inventory.GetCoords(index);
                if(!Inventory.IsFree(coords.x - offset.x, coords.y - offset.y, width, height)) {
                    return;
                }


                Inventory.FillSlot(
                    coords.x - offset.x,
                    coords.y - offset.y,
                    width + coords.x > Inventory.width ? Inventory.width - coords.x : width,
                    height,
                    true
                );


                lastCoords = coords;
            });
        },
        stop: function(event, ui) {
            first = true;
            $(event.target).find("img").css({
                top: 0,
                left: 0
            });

            // if dropped outside of inventory
            if(!ui.helper.data('dropped')) {
                Inventory.ClearSlot(lastCoords.x - offset.x, lastCoords.y - offset.y, width, height, true);
                $(this).css({top: 0, left: 0});
                // drop item, etc...
            }

            // fill new slot
            Inventory.FillSlot($(this).data('x'), $(this).data('y'), $(this).data('width'), $(this).data('height'));

            $('.item').css('pointer-events', 'all');

            // unbind the mousemove event
            $('.slot').unbind();
            offset = { x: 0, y: 0 };
        }
    });

    $(".slot").droppable({
        accept: '.item',
        tolerance: 'pointer',
        activeClass: 'droppable-highlight',
        drop: ItemDropEvent,
    });

    $(".equip-slot").droppable({
        accept: '.item',
        tolerance: 'pointer',
        activeClass: 'droppable-highlight',
        drop: ItemDropEvent,
    });



    $(".slot").click(function() {
        let index = Inventory.selector.children().index($(this));
        console.log(index);
        let coords = Inventory.GetCoords(index);
        console.log(coords.x + ":" + coords.y);
        console.log(Inventory.GetIndex(coords.x, coords.y));
    });
});

function ui_toggle(show) {
    show ? $('#user-interface').show() : $('#user-interface').hide();
}