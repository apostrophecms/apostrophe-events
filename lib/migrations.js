module.exports = function(self, options) {
  self.apos.migrations.add(self.__meta.name + ':update-event-children-parentId', async function() {
    // Get all parents' workflowGuid values
    return self.apos.migrations.eachDoc({
      type: 'apostrophe-event',
      dateType: 'repeat'
    }, async function(parent) {
      // Store parentWorkflowGuid value
      const parentWorkflowGuid = parent.workflowGuid;
  
      // Find all child documents matching the parent's _id
      // And update their `parentId` value
      const children = await self.apos.docs.db.find({
        type: 'apostrophe-event',
        parentId: parent._id,
      }).toArray();
  
      if (children.length) {
        await self.apos.docs.db.updateMany(
          {
            _id: {
              $in: children.map(child => child._id)
            }
          },
          {
            $set: {
              parentId: parentWorkflowGuid,
              hasClones: false,
            }
          }
        );
      }
    });
  });
}
