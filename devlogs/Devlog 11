Devlog 11. Tldr i added levels via a mapping algorithm. There is a nodal/procedural progression map system with 3 "acts" and 15 floors for each set. There are also 6 node types which will be Combat, Elite, Event, Shop,Rest and Boss. I have also added path validation so there isnt any possibility of save scumming but have not done the UI for it yet. 

All files are under the Map folder which hosts a manager,generator, map node,pathfinder,  and nodes (which cover the 6 node types that I have mentioned above) and of course a save and load system. Although I feel like it needs more work done in regards to save data with maybe supabase implementation in the future.

Map generator.js uses node distribution weights where it generates maps for each playthrough via these weighted probabilities which are combat - 0.55 , elite -0.15 , event -0.12. shop -0.08 and rest - 0.10. The algorithm itself is more complex i feel  where it has a random range for min and max nodes per floor, and a checker for guranteed nodes because I didnt want players to have a full shop floor or full relax floor to keep gameplay consistent. Then it fills the remaining slots with weighted randoms from the list above. 

There is also a connection selection logic which filters nodes between horizontal range to prevent impossible paths which may crash the map in game, and shuffles and selects random nodes. 

I feel like the devlog is getting really long but I did face some problems in the implementation which were. I had to cut a lot of content from the devlog here.

Problem : START node not found 
Root cause: The pathfinder couldnt find the start node after generation 
Fix: Node type comparison was case sensitive so I changed it to accept both capital and non capitals by changing n.type === 'start' to n.type === NodeType.START 

Problem : Map Modal Timing
Root cause and fix: NodeListView was initializing before modal DOM existed and the solution for that was a version of lazy loading which I thought of in my other project Sweettooth and I tweaked the logic a little to utilize Lazy initialization through a function. 

Problem: Combat Exploit 
Root cause and fix : I found out that an exploit where players could open the map during combat and spawn new favorable enemies to their circumstance so I implemented state checking. 

Problem : Path rendering 
Problem : Nodes needed X positions for a curved path drawing which made it really really messy. 
Solution: This part is basically solving how to spread nodes evenly across the screen so the connections between them can be drawn nicely. Instead of stacking everything randomly, each node gets an X position based on where it sits within its floor

Deliverables in todays session: 
Popup modal and not a permanent side panel for the map since it just takes up space
Vertical button list instead of canvas rendering
Connection limts for each node where it is 1-3 and a max of 2 nodes for horizontal distance
Guranteed nodes for forcing shops and rests on different floors.

Future deliverables:
Multi enemy nodes
Treasure rooms
Quick time events
Secret floors
Dynamic difficulty based on player performance
Some sort of Map preview or an oracle node (Okay this idea is really cool) 

