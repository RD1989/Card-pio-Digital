<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Restaurant extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'whatsapp_number',
        'logo_url',
        'banner_url',
        'accent_color',
        'social_links',
        'bio',
        'address',
        'theme_color',
        'is_active',
        'plan',
    ];

    protected $casts = [
        'social_links' => 'array',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function categories(): HasMany
    {
        return $this->hasMany(Category::class)->orderBy('sort_order');
    }

    public function products(): HasManyThrough
    {
        return $this->hasManyThrough(Product::class, Category::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(RestaurantOrder::class);
    }

    public function getPlanConfigAttribute()
    {
        $plan = $this->plan ?? 'free';
        return config("plans.{$plan}");
    }
}
