
export class EventService {
    
    async getEvents(query) {

        const { status, category, location, } = query;
        const filter = {};

        if (status) filter.status = status
        
        if (category) filter.category = category;
        
        if (location) filter.location = location;
        
        const events = await EventModel.find({status: "published", category: "música"});

        return events;
    }
     
}

