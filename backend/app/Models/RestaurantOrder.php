<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RestaurantOrder extends Model
{
    protected $fillable = ['restaurant_id', 'total_amount', 'customer_name', 'items_count'];

    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }
}
